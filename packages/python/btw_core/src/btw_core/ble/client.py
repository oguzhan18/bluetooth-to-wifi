from __future__ import annotations

import asyncio
import contextlib
from collections.abc import AsyncIterator, Awaitable, Callable
from typing import Any

from bleak import BleakClient, BleakScanner
from bleak.backends.characteristic import BleakGATTCharacteristic
from bleak.backends.device import BLEDevice
from bleak.backends.scanner import AdvertisementData
from bleak.exc import BleakDBusError, BleakError

from btw_core.exceptions import BleNotConnected, ConfigurationError
from btw_core.models import BleAdvertisement, ConnectionPolicy, GattTarget


def _scanner_kwargs(adapter: str | None) -> dict[str, Any]:
    if not adapter:
        return {}
    return {"bluez": {"adapter": adapter}}


def _from_pair(d: BLEDevice, ad: AdvertisementData | None) -> BleAdvertisement:
    if ad is not None:
        name = ad.local_name or d.name
        rssi = ad.rssi
        md = dict(ad.manufacturer_data)
        suuids = [u.lower() for u in ad.service_uuids]
    else:
        name = d.name
        rssi = None
        md = {}
        suuids = []
    return BleAdvertisement(
        address=d.address,
        name=name,
        rssi=rssi,
        manufacturer_data=md,
        service_uuids=suuids,
    )


class BleStack:
    def __init__(self, adapter: str | None = None) -> None:
        self._adapter = adapter

    async def scan(
        self,
        *,
        timeout_s: float = 5.0,
        filter_fn: Callable[[BleAdvertisement], bool] | None = None,
    ) -> list[BleAdvertisement]:
        kwargs = _scanner_kwargs(self._adapter)
        found = await BleakScanner.discover(timeout=timeout_s, return_adv=True, **kwargs)
        out: list[BleAdvertisement] = []
        for _key, (device, adv) in found.items():
            a = _from_pair(device, adv)
            if filter_fn is None or filter_fn(a):
                out.append(a)
        return out

    async def scan_live(
        self,
        *,
        duration_s: float,
        filter_fn: Callable[[BleAdvertisement], bool] | None = None,
    ) -> AsyncIterator[BleAdvertisement]:
        q: asyncio.Queue[BleAdvertisement] = asyncio.Queue(maxsize=512)
        sk = _scanner_kwargs(self._adapter)

        def _cb(device: BLEDevice, advertisement_data: AdvertisementData) -> None:
            a = _from_pair(device, advertisement_data)
            if filter_fn is not None and not filter_fn(a):
                return
            with contextlib.suppress(asyncio.QueueFull):
                q.put_nowait(a)

        loop = asyncio.get_event_loop()
        end = loop.time() + duration_s
        async with BleakScanner(_cb, **sk):
            while loop.time() < end:
                try:
                    yield await asyncio.wait_for(q.get(), timeout=0.25)
                except TimeoutError:
                    continue


class BleSession:
    def __init__(
        self,
        address: str,
        *,
        adapter: str | None = None,
        policy: ConnectionPolicy | None = None,
    ) -> None:
        self._address = address
        self._adapter = adapter
        self._policy = policy or ConnectionPolicy()
        self._client: BleakClient | None = None
        self._lock = asyncio.Lock()

    @property
    def address(self) -> str:
        return self._address

    def _client_kwargs(self) -> dict[str, Any]:
        if not self._adapter:
            return {}
        return {"bluez": {"adapter": self._adapter}}

    async def connect(self) -> None:
        delay = self._policy.base_delay_s
        last: Exception | None = None
        for _ in range(self._policy.max_retries):
            try:
                self._client = BleakClient(self._address, **self._client_kwargs())
                await self._client.connect()
                return
            except (BleakError, BleakDBusError, TimeoutError) as e:
                last = e
                self._client = None
                await asyncio.sleep(delay)
                delay = min(delay * 2, self._policy.max_delay_s)
        assert last is not None
        raise last

    async def disconnect(self) -> None:
        if self._client is not None:
            with contextlib.suppress(Exception):
                await self._client.disconnect()
        self._client = None

    def _require(self) -> BleakClient:
        if self._client is None or not self._client.is_connected:
            raise BleNotConnected(self._address)
        return self._client

    async def read_gatt(self, target: GattTarget) -> bytearray:
        async with self._lock:
            c = self._require()
            return await c.read_gatt_char(target.characteristic_uuid)

    async def write_gatt(self, target: GattTarget, data: bytes, *, response: bool = False) -> None:
        async with self._lock:
            c = self._require()
            await c.write_gatt_char(target.characteristic_uuid, data, response=response)

    async def notify_stream(
        self,
        target: GattTarget,
    ) -> tuple[Callable[[], Awaitable[None]], asyncio.Queue[bytes]]:
        if not target.notify:
            raise ConfigurationError("GATT target must have notify=True")
        q: asyncio.Queue[bytes] = asyncio.Queue()

        def _handler(_: BleakGATTCharacteristic, data: bytearray) -> None:
            q.put_nowait(bytes(data))

        async def _start() -> None:
            async with self._lock:
                c = self._require()
                await c.start_notify(target.characteristic_uuid, _handler)

        async def _stop() -> None:
            async with self._lock:
                c = self._require()
                with contextlib.suppress(Exception):
                    await c.stop_notify(target.characteristic_uuid)

        await _start()
        return _stop, q
