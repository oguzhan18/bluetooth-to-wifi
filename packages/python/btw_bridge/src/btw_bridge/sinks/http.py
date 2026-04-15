from __future__ import annotations

import httpx

from btw_bridge.envelope import DeviceEnvelope


class HttpSink:
    def __init__(
        self,
        url: str,
        *,
        timeout_s: float = 10.0,
        headers: dict[str, str] | None = None,
    ) -> None:
        self._url = url
        self._client = httpx.AsyncClient(timeout=timeout_s, headers=headers or {})

    async def emit(self, envelope: DeviceEnvelope) -> None:
        await self._client.post(
            self._url,
            content=envelope.model_dump_json_bytes(),
            headers={"content-type": "application/json"},
        )

    async def aclose(self) -> None:
        await self._client.aclose()
