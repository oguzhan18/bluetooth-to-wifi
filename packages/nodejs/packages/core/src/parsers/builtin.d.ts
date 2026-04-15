import { DeviceReading } from "../model.js";
import type { PayloadParser } from "./registry.js";
export declare class TemperatureInt16Parser implements PayloadParser {
    supports(_svc: string | null, ch: string | null, raw: Buffer): boolean;
    parse(_svc: string | null, ch: string | null, raw: Buffer): DeviceReading;
}
export declare class HumidityParser implements PayloadParser {
    supports(_svc: string | null, ch: string | null, raw: Buffer): boolean;
    parse(_svc: string | null, ch: string | null, raw: Buffer): DeviceReading;
}
export declare class BinarySwitchParser implements PayloadParser {
    supports(_svc: string | null, _ch: string | null, raw: Buffer): boolean;
    parse(_svc: string | null, ch: string | null, raw: Buffer): DeviceReading;
}
export declare class RawBytesParser implements PayloadParser {
    supports(): boolean;
    parse(_svc: string | null, ch: string | null, raw: Buffer): DeviceReading;
}
//# sourceMappingURL=builtin.d.ts.map