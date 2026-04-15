from __future__ import annotations

import asyncio
from types import TracebackType

from aiomqtt import Client, MqttError

from btw_bridge.envelope import DeviceEnvelope


class MqttSink:
    def __init__(
        self,
        *,
        host: str,
        port: int = 1883,
        topic: str,
        username: str | None = None,
        password: str | None = None,
    ) -> None:
        self._host = host
        self._port = port
        self._topic = topic
        self._username = username
        self._password = password
        self._client: Client | None = None
        self._lock = asyncio.Lock()

    async def __aenter__(self) -> MqttSink:
        self._client = Client(
            hostname=self._host,
            port=self._port,
            username=self._username,
            password=self._password,
        )
        await self._client.__aenter__()
        return self

    async def __aexit__(
        self,
        exc_type: type[BaseException] | None,
        exc: BaseException | None,
        tb: TracebackType | None,
    ) -> None:
        if self._client is not None:
            await self._client.__aexit__(exc_type, exc, tb)
        self._client = None

    async def emit(self, envelope: DeviceEnvelope) -> None:
        if self._client is None:
            raise RuntimeError("MqttSink must be used as an async context manager")
        payload = envelope.model_dump_json_bytes()
        async with self._lock:
            try:
                await self._client.publish(self._topic, payload=payload, qos=1)
            except MqttError:
                raise

    async def aclose(self) -> None:
        if self._client is not None:
            await self._client.__aexit__(None, None, None)
        self._client = None
