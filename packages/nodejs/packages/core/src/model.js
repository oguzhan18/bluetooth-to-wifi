export var PayloadKind;
(function (PayloadKind) {
    PayloadKind["TemperatureC"] = "temperature_c";
    PayloadKind["HumidityPct"] = "humidity_pct";
    PayloadKind["Switch"] = "switch";
    PayloadKind["BinarySensor"] = "binary_sensor";
    PayloadKind["RawBytes"] = "raw_bytes";
    PayloadKind["Generic"] = "generic";
})(PayloadKind || (PayloadKind = {}));
export const defaultConnectionPolicy = () => ({
    maxRetries: 5,
    baseDelayMs: 400,
    maxDelayMs: 8000,
});
//# sourceMappingURL=model.js.map