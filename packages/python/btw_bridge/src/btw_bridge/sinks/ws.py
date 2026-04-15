from __future__ import annotations

import asyncio
from typing import Any

import websockets

from btw_bridge.envelope import DeviceEnvelope


class WebSocketSink:
    def __init__(self, uri: str) -> None:
        self._uri = uri
        self._lock = asyncio.Lock()
        self._ws: Any = None

    async def _conn(self) -> Any:
        if self._ws is None or self._ws.closed:
            self._ws = await websockets.connect(self._uri, max_size=None)
        return self._ws

    async def emit(self, envelope: DeviceEnvelope) -> None:
        async with self._lock:
            ws = await self._conn()
            await ws.send(envelope.model_dump_json_bytes())

    async def aclose(self) -> None:
        async with self._lock:
            if self._ws is not None and not self._ws.closed:
                await self._ws.close()
            self._ws = None
