# Node.js packages

- `@btw/core` — Noble-based scan/session and parsers (Linux + BlueZ recommended).
- `@btw/bridge` — Zod envelope + HTTP / WebSocket / MQTT sinks.
- `@btw/api` — Fastify `/health`, `POST /v1/ingest`, `GET /v1/stream` (WebSocket).

## Notes

- BLE runtime support depends on the OS. For production BLE bridging, prefer **Linux**.
- If the path contains spaces, native installs can break. You can still compile TypeScript with:
  - `npm install --ignore-scripts`

## Build

From this directory:

```bash
npm install
npm run build
```

