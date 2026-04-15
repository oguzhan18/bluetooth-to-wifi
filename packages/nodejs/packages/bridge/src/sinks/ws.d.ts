import type { DeviceEnvelope } from "../envelope.js";
export declare class WebSocketSink {
    private readonly uri;
    private ws;
    private connecting;
    constructor(uri: string);
    private ensure;
    emit(envelope: DeviceEnvelope): Promise<void>;
    close(): Promise<void>;
}
//# sourceMappingURL=ws.d.ts.map