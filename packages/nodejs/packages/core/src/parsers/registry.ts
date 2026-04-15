import { DeviceReading } from "../model.js";
import {
  BinarySwitchParser,
  HumidityParser,
  RawBytesParser,
  TemperatureInt16Parser,
} from "./builtin.js";

export interface PayloadParser {
  supports(serviceUuid: string | null, characteristicUuid: string | null, raw: Buffer): boolean;
  parse(
    serviceUuid: string | null,
    characteristicUuid: string | null,
    raw: Buffer,
  ): DeviceReading;
}

export class ParserRegistry {
  private readonly parsers: PayloadParser[] = [];

  constructor(parsers: PayloadParser[] = []) {
    this.parsers = [...parsers];
  }

  register(p: PayloadParser): void {
    this.parsers.unshift(p);
  }

  parse(serviceUuid: string | null, characteristicUuid: string | null, raw: Buffer): DeviceReading {
    for (const p of this.parsers) {
      if (p.supports(serviceUuid, characteristicUuid, raw)) {
        return p.parse(serviceUuid, characteristicUuid, raw);
      }
    }
    throw new Error("no parser matched");
  }
}

export function defaultRegistry(): ParserRegistry {
  return new ParserRegistry([
    new TemperatureInt16Parser(),
    new HumidityParser(),
    new BinarySwitchParser(),
    new RawBytesParser(),
  ]);
}
