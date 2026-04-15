import type { DeviceEnvelope } from "../envelope.js";
export declare class MqttSink {
    private readonly url;
    private readonly topic;
    private client;
    constructor(url: string, topic: string);
    open(): Promise<void>;
    emit(envelope: DeviceEnvelope): Promise<void>;
    close(): Promise<void>;
}
//# sourceMappingURL=mqtt.d.ts.map