from __future__ import annotations

import os
from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import Depends, FastAPI, Request, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse, PlainTextResponse

from btw_bridge.envelope import DeviceEnvelope
from btw_bridge.sinks.mqtt import MqttSink

from btw_api.state import AppState


def create_app() -> FastAPI:
    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        mqtt: MqttSink | None = None
        host = os.environ.get("BTW_MQTT_HOST")
        topic = os.environ.get("BTW_MQTT_TOPIC")
        if host and topic:
            port = int(os.environ.get("BTW_MQTT_PORT", "1883"))
            user = os.environ.get("BTW_MQTT_USER")
            pwd = os.environ.get("BTW_MQTT_PASSWORD")
            mqtt = MqttSink(
                host=host, port=port, topic=topic, username=user, password=pwd
            )
            await mqtt.__aenter__()
        app.state.mqtt_sink = mqtt
        yield
        if mqtt is not None:
            await mqtt.aclose()

    app = FastAPI(title="bluetooth-to-wifi", version="0.1.0", lifespan=lifespan)
    app.state.btw = AppState()

    def get_state() -> AppState:
        return app.state.btw

    @app.get("/health")
    async def health() -> PlainTextResponse:
        return PlainTextResponse("ok")

    @app.post("/v1/ingest")
    async def ingest(
        request: Request, body: DeviceEnvelope, st: AppState = Depends(get_state)
    ) -> JSONResponse:
        raw = body.model_dump_json_bytes()
        await st.broadcast_json(raw)
        mqtt: MqttSink | None = getattr(request.app.state, "mqtt_sink", None)
        if mqtt is not None:
            await mqtt.emit(body)
        return JSONResponse({"accepted": True})

    @app.websocket("/v1/stream")
    async def stream(ws: WebSocket, st: AppState = Depends(get_state)) -> None:
        await ws.accept()
        async with st.lock:
            st.subscribers.add(ws)
        try:
            while True:
                msg = await ws.receive()
                if msg.get("type") == "websocket.disconnect":
                    break
        except WebSocketDisconnect:
            pass
        finally:
            async with st.lock:
                st.subscribers.discard(ws)

    return app
