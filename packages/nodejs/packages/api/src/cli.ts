#!/usr/bin/env node
import { buildServer } from "./server.js";

function parseArg(name: string): string | null {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return null;
  const v = process.argv[idx + 1];
  return v ? v : null;
}

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  // Minimal help to keep zero-deps
  // eslint-disable-next-line no-console
  console.log(
    [
      "btw-api-node",
      "",
      "Env:",
      "  BTW_HOST=127.0.0.1",
      "  BTW_PORT=8765",
      "  BTW_MQTT_URL=mqtt://127.0.0.1",
      "  BTW_MQTT_TOPIC=btw/devices",
      "",
      "Args:",
      "  --host 0.0.0.0",
      "  --port 8765",
      "",
    ].join("\n"),
  );
  process.exit(0);
}

const port = Number(parseArg("--port") ?? process.env.BTW_PORT ?? "8765");
const host = parseArg("--host") ?? process.env.BTW_HOST ?? "127.0.0.1";
const mqttUrl = process.env.BTW_MQTT_URL;
const mqttTopic = process.env.BTW_MQTT_TOPIC;

const { app, close } = await buildServer({ mqttUrl, mqttTopic });
await app.listen({ port, host });

const shutdown = async () => {
  await close();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
