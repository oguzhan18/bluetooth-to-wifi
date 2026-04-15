import { BinarySwitchParser, HumidityParser, RawBytesParser, TemperatureInt16Parser, } from "./builtin.js";
export class ParserRegistry {
    parsers = [];
    constructor(parsers = []) {
        this.parsers = [...parsers];
    }
    register(p) {
        this.parsers.unshift(p);
    }
    parse(serviceUuid, characteristicUuid, raw) {
        for (const p of this.parsers) {
            if (p.supports(serviceUuid, characteristicUuid, raw)) {
                return p.parse(serviceUuid, characteristicUuid, raw);
            }
        }
        throw new Error("no parser matched");
    }
}
export function defaultRegistry() {
    return new ParserRegistry([
        new TemperatureInt16Parser(),
        new HumidityParser(),
        new BinarySwitchParser(),
        new RawBytesParser(),
    ]);
}
//# sourceMappingURL=registry.js.map