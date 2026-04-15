import { type ConnectionPolicy, type GattTarget } from "../model.js";
export declare class BleSession {
    readonly address: string;
    private peripheral;
    private policy;
    constructor(address: string, policy?: ConnectionPolicy);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    private requireConnected;
    readGatt(target: GattTarget): Promise<Buffer>;
    notifyStream(target: GattTarget): Promise<{
        stop: () => Promise<void>;
        queue: AsyncIterable<Buffer>;
    }>;
}
//# sourceMappingURL=session.d.ts.map