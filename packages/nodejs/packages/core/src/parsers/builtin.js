import { PayloadKind } from "../model.js";
const TEMP_CHAR = "00002a6e-0000-1000-8000-00805f9b34fb";
const HUM_CHAR = "00002a6f-0000-1000-8000-00805f9b34fb";
function norm(u) {
    if (!u)
        return null;
    return u.replace(/-/g, "").toLowerCase();
}
export class TemperatureInt16Parser {
    supports(_svc, ch, raw) {
        return norm(ch) === norm(TEMP_CHAR) && raw.length >= 2;
    }
    parse(_svc, ch, raw) {
        const value = raw.readInt16LE(0) / 100;
        return {
            kind: PayloadKind.TemperatureC,
            data: { value, unit: "celsius" },
            characteristicUuid: ch ?? undefined,
        };
    }
}
export class HumidityParser {
    supports(_svc, ch, raw) {
        return norm(ch) === norm(HUM_CHAR) && raw.length >= 2;
    }
    parse(_svc, ch, raw) {
        const value = raw.readUInt16LE(0) / 100;
        return {
            kind: PayloadKind.HumidityPct,
            data: { value, unit: "percent" },
            characteristicUuid: ch ?? undefined,
        };
    }
}
export class BinarySwitchParser {
    supports(_svc, _ch, raw) {
        return raw.length === 1;
    }
    parse(_svc, ch, raw) {
        return {
            kind: PayloadKind.Switch,
            data: { on: raw[0] !== 0 },
            characteristicUuid: ch ?? undefined,
        };
    }
}
export class RawBytesParser {
    supports() {
        return true;
    }
    parse(_svc, ch, raw) {
        return {
            kind: PayloadKind.RawBytes,
            data: { hex: raw.toString("hex"), length: raw.length },
            characteristicUuid: ch ?? undefined,
        };
    }
}
//# sourceMappingURL=builtin.js.map