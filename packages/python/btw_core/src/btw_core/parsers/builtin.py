from __future__ import annotations

import struct
from uuid import UUID

from btw_core.exceptions import ParseError
from btw_core.models import DeviceReading, PayloadKind

_TEMP_CHAR = "00002a6e-0000-1000-8000-00805f9b34fb"
_HUM_CHAR = "00002a6f-0000-1000-8000-00805f9b34fb"


def _norm(u: str | None) -> str | None:
    if u is None:
        return None
    try:
        return str(UUID(u)).lower()
    except ValueError:
        return u.lower()


class TemperatureInt16Parser:
    def supports(
        self, service_uuid: str | None, characteristic_uuid: str | None, raw: bytes
    ) -> bool:
        return _norm(characteristic_uuid) == _TEMP_CHAR and len(raw) >= 2

    def parse(
        self,
        service_uuid: str | None,
        characteristic_uuid: str | None,
        raw: bytes,
    ) -> DeviceReading:
        if len(raw) < 2:
            raise ParseError("temperature buffer too short")
        value_c = struct.unpack_from("<h", raw, 0)[0] / 100.0
        return DeviceReading(
            PayloadKind.TEMPERATURE_C,
            {"value": value_c, "unit": "celsius"},
            characteristic_uuid,
        )


class HumidityParser:
    def supports(
        self, service_uuid: str | None, characteristic_uuid: str | None, raw: bytes
    ) -> bool:
        return _norm(characteristic_uuid) == _HUM_CHAR and len(raw) >= 2

    def parse(
        self,
        service_uuid: str | None,
        characteristic_uuid: str | None,
        raw: bytes,
    ) -> DeviceReading:
        if len(raw) < 2:
            raise ParseError("humidity buffer too short")
        value = struct.unpack_from("<H", raw, 0)[0] / 100.0
        return DeviceReading(
            PayloadKind.HUMIDITY_PCT,
            {"value": value, "unit": "percent"},
            characteristic_uuid,
        )


class BinarySwitchParser:
    def supports(
        self, service_uuid: str | None, characteristic_uuid: str | None, raw: bytes
    ) -> bool:
        return len(raw) == 1

    def parse(
        self,
        service_uuid: str | None,
        characteristic_uuid: str | None,
        raw: bytes,
    ) -> DeviceReading:
        on = raw[0] != 0
        return DeviceReading(PayloadKind.SWITCH, {"on": on}, characteristic_uuid)


class RawBytesParser:
    def supports(
        self, service_uuid: str | None, characteristic_uuid: str | None, raw: bytes
    ) -> bool:
        return True

    def parse(
        self,
        service_uuid: str | None,
        characteristic_uuid: str | None,
        raw: bytes,
    ) -> DeviceReading:
        return DeviceReading(
            PayloadKind.RAW_BYTES,
            {"hex": raw.hex(), "length": len(raw)},
            characteristic_uuid,
        )
