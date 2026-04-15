from __future__ import annotations

from btw_bridge.envelope import DeviceEnvelope, EnvelopeFactory
from btw_bridge.sinks.base import EnvelopeSink


class BridgePipeline:
    def __init__(self, factory: EnvelopeFactory, sinks: list[EnvelopeSink]) -> None:
        self._factory = factory
        self._sinks = list(sinks)

    async def forward(self, envelope: DeviceEnvelope) -> None:
        for s in self._sinks:
            await s.emit(envelope)

    async def close(self) -> None:
        for s in self._sinks:
            await s.aclose()
