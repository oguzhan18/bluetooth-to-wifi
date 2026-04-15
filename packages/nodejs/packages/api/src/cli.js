#!/usr/bin/env node
import { buildServer } from "./server.js";
const port = Number(process.env.BTW_PORT ?? "8765");
const host = process.env.BTW_HOST ?? "127.0.0.1";
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
//# sourceMappingURL=cli.js.map