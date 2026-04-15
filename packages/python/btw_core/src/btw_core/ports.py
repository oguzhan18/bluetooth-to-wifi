from __future__ import annotations

from typing import Protocol, runtime_checkable

from btw_core.models import BleAdvertisement, DeviceReading


@runtime_checkable
class PayloadParser(Protocol):
    def supports(
        self, service_uuid: str | None, characteristic_uuid: str | None, raw: bytes
    ) -> bool: ...

    def parse(
        self,
        service_uuid: str | None,
        characteristic_uuid: str | None,
        raw: bytes,
    ) -> DeviceReading: ...


@runtime_checkable
class AdvertisementFilter(Protocol):
    def accept(self, adv: BleAdvertisement) -> bool: ...
