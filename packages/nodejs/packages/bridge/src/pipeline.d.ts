import type { DeviceEnvelope } from "./envelope.js";
export interface EnvelopeSink {
    emit(envelope: DeviceEnvelope): Promise<void>;
    close(): Promise<void>;
}
export declare class BridgePipeline {
    private readonly sinks;
    constructor(sinks: EnvelopeSink[]);
    forward(envelope: DeviceEnvelope): Promise<void>;
    close(): Promise<void>;
}
//# sourceMappingURL=pipeline.d.ts.map