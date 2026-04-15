from __future__ import annotations

import asyncio
from dataclasses import dataclass, field

from fastapi import WebSocket


@dataclass
class AppState:
    subscribers: set[WebSocket] = field(default_factory=set)
    lock: asyncio.Lock = field(default_factory=asyncio.Lock)

    async def broadcast_json(self, data: bytes) -> None:
        dead: list[WebSocket] = []
        async with self.lock:
            for ws in self.subscribers:
                try:
                    await ws.send_bytes(data)
                except Exception:
                    dead.append(ws)
            for ws in dead:
                self.subscribers.discard(ws)
