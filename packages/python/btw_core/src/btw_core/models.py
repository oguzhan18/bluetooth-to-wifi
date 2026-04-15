from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum
from typing import Any


class PayloadKind(StrEnum):
    TEMPERATURE_C = "temperature_c"
    HUMIDITY_PCT = "humidity_pct"
    SWITCH = "switch"
    BINARY_SENSOR = "binary_sensor"
    RAW_BYTES = "raw_bytes"
    GENERIC = "generic"


@dataclass(frozen=True, slots=True)
class BleAdvertisement:
    address: str
    name: str | None
    rssi: int | None
    manufacturer_data: dict[int, bytes]
    service_uuids: list[str]


@dataclass(frozen=True, slots=True)
class DeviceReading:
    kind: PayloadKind
    data: dict[str, Any]
    characteristic_uuid: str | None = None


@dataclass(frozen=True, slots=True)
class GattTarget:
    service_uuid: str
    characteristic_uuid: str
    notify: bool = False


@dataclass(frozen=True, slots=True)
class ConnectionPolicy:
    max_retries: int = 5
    base_delay_s: float = 0.4
    max_delay_s: float = 8.0
