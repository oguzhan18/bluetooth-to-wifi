import { deviceEnvelopeSchema, MqttSink } from "@btw/bridge";
import fastifyWebsocket from "@fastify/websocket";
import Fastify from "fastify";
export async function buildServer(options) {
    const subscribers = new Set();
    let mqtt = null;
    if (options.mqttUrl && options.mqttTopic) {
        mqtt = new MqttSink(options.mqttUrl, options.mqttTopic);
        await mqtt.open();
    }
    const app = Fastify({ logger: true });
    await app.register(fastifyWebsocket);
    app.get("/health", async () => "ok");
    app.post("/v1/ingest", async (req, reply) => {
        const parsed = deviceEnvelopeSchema.safeParse(req.body);
        if (!parsed.success) {
            return reply.code(400).send({ error: "invalid envelope" });
        }
        const env = parsed.data;
        const raw = Buffer.from(JSON.stringify(env), "utf8");
        for (const s of subscribers) {
            s.send(raw);
        }
        if (mqtt)
            await mqtt.emit(env);
        return { accepted: true };
    });
    app.get("/v1/stream", { websocket: true }, (conn) => {
        const s = {
            send: (b) => {
                conn.socket.send(b);
            },
        };
        subscribers.add(s);
        conn.socket.on("close", () => subscribers.delete(s));
    });
    const close = async () => {
        await app.close();
        if (mqtt)
            await mqtt.close();
    };
    return { app, close };
}
//# sourceMappingURL=server.js.map