from __future__ import annotations

import argparse
import asyncio
import os

from btw_bridge.envelope import EnvelopeFactory
from btw_bridge.pipeline import BridgePipeline
from btw_bridge.sinks.http import HttpSink
from btw_bridge.sinks.ws import WebSocketSink
from btw_core.ble.client import BleSession, BleStack
from btw_core.models import BleAdvertisement, GattTarget
from btw_core.parsers.registry import default_registry


def _backoff_s(attempt: int, *, base: float = 0.4, cap: float = 12.0) -> float:
    return min(cap, base * (2**attempt))


async def _run(args: argparse.Namespace) -> None:
    reg = default_registry()
    factory = EnvelopeFactory(runtime="python", bridge_id=args.bridge_id)
    sinks: list = []
    if args.http_url:
        sinks.append(HttpSink(args.http_url))
    if args.ws_uri:
        sinks.append(WebSocketSink(args.ws_uri))
    pipeline = BridgePipeline(factory, sinks)
    adv: BleAdvertisement | None = None
    if args.ble_address:
        stack = BleStack(adapter=args.adapter)
        found = await stack.scan(timeout_s=args.scan_timeout_s)
        for a in found:
            if a.address.lower() == args.ble_address.lower():
                adv = a
                break
        if adv is None:
            adv = BleAdvertisement(
                address=args.ble_address,
                name=None,
                rssi=None,
                manufacturer_data={},
                service_uuids=[],
            )
    else:
        raise SystemExit("BLE address required")

    target = GattTarget(
        service_uuid=args.service_uuid,
        characteristic_uuid=args.characteristic_uuid,
        notify=args.notify,
    )

    attempt = 0
    while True:
        session = BleSession(adv.address, adapter=args.adapter)
        try:
            await session.connect()
            attempt = 0
            if args.notify:
                stop, q = await session.notify_stream(target)
                try:
                    while True:
                        raw = await q.get()
                        reading = reg.parse(
                            args.service_uuid, args.characteristic_uuid, raw
                        )
                        env = factory.from_reading(adv, reading, adapter=args.adapter)
                        await pipeline.forward(env)
                finally:
                    await stop()
                continue
            else:
                raw = await session.read_gatt(target)
                reading = reg.parse(
                    args.service_uuid, args.characteristic_uuid, bytes(raw)
                )
                env = factory.from_reading(adv, reading, adapter=args.adapter)
                await pipeline.forward(env)
                return
        except Exception:
            await asyncio.sleep(_backoff_s(attempt))
            attempt += 1
            continue
        finally:
            await session.disconnect()
            if not args.notify:
                await pipeline.close()


def _parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(prog="btw-gw")
    p.add_argument("--ble-address", default=os.environ.get("BTW_BLE_ADDRESS"))
    p.add_argument("--adapter", default=os.environ.get("BTW_ADAPTER"))
    p.add_argument(
        "--service-uuid",
        default=os.environ.get(
            "BTW_SERVICE_UUID", "0000180a-0000-1000-8000-00805f9b34fb"
        ),
    )
    p.add_argument(
        "--characteristic-uuid",
        default=os.environ.get("BTW_CHAR_UUID", "00002a6e-0000-1000-8000-00805f9b34fb"),
    )
    p.add_argument("--notify", action=argparse.BooleanOptionalAction, default=True)
    p.add_argument("--scan-timeout-s", type=float, default=6.0)
    p.add_argument("--http-url", default=os.environ.get("BTW_HTTP_URL"))
    p.add_argument("--ws-uri", default=os.environ.get("BTW_WS_URI"))
    p.add_argument("--bridge-id", default=os.environ.get("BTW_BRIDGE_ID", "python-gw"))
    return p


def main() -> None:
    args = _parser().parse_args()
    if not args.http_url and not args.ws_uri:
        raise SystemExit("set --http-url and/or --ws-uri")
    asyncio.run(_run(args))


if __name__ == "__main__":
    main()
