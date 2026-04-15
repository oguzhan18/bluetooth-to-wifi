from __future__ import annotations

import time
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field

from btw_core.models import BleAdvertisement, DeviceReading, PayloadKind


class SourceMeta(BaseModel):
    model_config = ConfigDict(frozen=True)

    runtime: Literal["python", "nodejs", "esp32"]
    bridge_id: str | None = None
    adapter: str | None = None


class DeviceMeta(BaseModel):
    model_config = ConfigDict(frozen=True)

    address: str
    name: str | None = None
    manufacturer_data_hex: str | None = None
    service_uuids: list[str] = Field(default_factory=list)


class PayloadModel(BaseModel):
    model_config = ConfigDict(frozen=True, use_enum_values=True)

    kind: PayloadKind
    data: dict[str, Any]
    characteristic_uuid: str | None = None


class DeviceEnvelope(BaseModel):
    model_config = ConfigDict(frozen=True)

    schema_version: Literal[1] = 1
    source: SourceMeta
    device: DeviceMeta
    payload: PayloadModel
    timestamp_ms: int
    rssi: int | None = None

    def model_dump_json_bytes(self) -> bytes:
        return self.model_dump_json().encode("utf-8")


class EnvelopeFactory:
    def __init__(
        self, *, runtime: Literal["python", "nodejs", "esp32"], bridge_id: str | None
    ) -> None:
        self._runtime = runtime
        self._bridge_id = bridge_id

    def from_reading(
        self,
        adv: BleAdvertisement,
        reading: DeviceReading,
        *,
        adapter: str | None = None,
    ) -> DeviceEnvelope:
        md_hex: str | None = None
        if adv.manufacturer_data:
            blob = b"".join(v for _, v in sorted(adv.manufacturer_data.items()))
            md_hex = blob.hex() if blob else None
        return DeviceEnvelope(
            source=SourceMeta(
                runtime=self._runtime, bridge_id=self._bridge_id, adapter=adapter
            ),
            device=DeviceMeta(
                address=adv.address,
                name=adv.name,
                manufacturer_data_hex=md_hex,
                service_uuids=list(adv.service_uuids),
            ),
            payload=PayloadModel(
                kind=reading.kind,
                data=reading.data,
                characteristic_uuid=reading.characteristic_uuid,
            ),
            timestamp_ms=int(time.time() * 1000),
            rssi=adv.rssi,
        )
