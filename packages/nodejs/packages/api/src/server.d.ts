import Fastify from "fastify";
export declare function buildServer(options: {
    mqttUrl?: string;
    mqttTopic?: string;
}): Promise<{
    app: ReturnType<typeof Fastify>;
    close: () => Promise<void>;
}>;
//# sourceMappingURL=server.d.ts.map