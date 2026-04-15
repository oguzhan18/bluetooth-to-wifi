import type { DeviceEnvelope } from "../envelope.js";
export declare class HttpSink {
    private readonly url;
    private readonly fetchFn;
    constructor(url: string, fetchFn?: typeof fetch);
    emit(envelope: DeviceEnvelope): Promise<void>;
    close(): Promise<void>;
}
//# sourceMappingURL=http.d.ts.map