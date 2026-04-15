from __future__ import annotations

from typing import Protocol, runtime_checkable

from btw_bridge.envelope import DeviceEnvelope


@runtime_checkable
class EnvelopeSink(Protocol):
    async def emit(self, envelope: DeviceEnvelope) -> None: ...

    async def aclose(self) -> None: ...
