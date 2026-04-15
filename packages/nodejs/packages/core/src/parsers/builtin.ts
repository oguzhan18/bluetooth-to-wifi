import { DeviceReading, PayloadKind } from "../model.js";
import type { PayloadParser } from "./registry.js";

const TEMP_CHAR = "00002a6e-0000-1000-8000-00805f9b34fb";
const HUM_CHAR = "00002a6f-0000-1000-8000-00805f9b34fb";

function norm(u: string | null | undefined): string | null {
  if (!u) return null;
  return u.replace(/-/g, "").toLowerCase();
}

export class TemperatureInt16Parser implements PayloadParser {
  supports(_svc: string | null, ch: string | null, raw: Buffer): boolean {
    return norm(ch) === norm(TEMP_CHAR) && raw.length >= 2;
  }

  parse(_svc: string | null, ch: string | null, raw: Buffer): DeviceReading {
    const value = raw.readInt16LE(0) / 100;
    return {
      kind: PayloadKind.TemperatureC,
      data: { value, unit: "celsius" },
      characteristicUuid: ch ?? undefined,
    };
  }
}

export class HumidityParser implements PayloadParser {
  supports(_svc: string | null, ch: string | null, raw: Buffer): boolean {
    return norm(ch) === norm(HUM_CHAR) && raw.length >= 2;
  }

  parse(_svc: string | null, ch: string | null, raw: Buffer): DeviceReading {
    const value = raw.readUInt16LE(0) / 100;
    return {
      kind: PayloadKind.HumidityPct,
      data: { value, unit: "percent" },
      characteristicUuid: ch ?? undefined,
    };
  }
}

export class BinarySwitchParser implements PayloadParser {
  supports(_svc: string | null, _ch: string | null, raw: Buffer): boolean {
    return raw.length === 1;
  }

  parse(_svc: string | null, ch: string | null, raw: Buffer): DeviceReading {
    return {
      kind: PayloadKind.Switch,
      data: { on: raw[0] !== 0 },
      characteristicUuid: ch ?? undefined,
    };
  }
}

export class RawBytesParser implements PayloadParser {
  supports(): boolean {
    return true;
  }

  parse(_svc: string | null, ch: string | null, raw: Buffer): DeviceReading {
    return {
      kind: PayloadKind.RawBytes,
      data: { hex: raw.toString("hex"), length: raw.length },
      characteristicUuid: ch ?? undefined,
    };
  }
}
