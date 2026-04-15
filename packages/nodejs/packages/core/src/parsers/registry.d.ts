import { DeviceReading } from "../model.js";
export interface PayloadParser {
    supports(serviceUuid: string | null, characteristicUuid: string | null, raw: Buffer): boolean;
    parse(serviceUuid: string | null, characteristicUuid: string | null, raw: Buffer): DeviceReading;
}
export declare class ParserRegistry {
    private readonly parsers;
    constructor(parsers?: PayloadParser[]);
    register(p: PayloadParser): void;
    parse(serviceUuid: string | null, characteristicUuid: string | null, raw: Buffer): DeviceReading;
}
export declare function defaultRegistry(): ParserRegistry;
//# sourceMappingURL=registry.d.ts.map