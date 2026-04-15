export declare enum PayloadKind {
    TemperatureC = "temperature_c",
    HumidityPct = "humidity_pct",
    Switch = "switch",
    BinarySensor = "binary_sensor",
    RawBytes = "raw_bytes",
    Generic = "generic"
}
export interface BleAdvertisement {
    address: string;
    name: string | null;
    rssi: number | null;
    manufacturerData: Map<number, Buffer>;
    serviceUuids: string[];
}
export interface DeviceReading {
    kind: PayloadKind;
    data: Record<string, unknown>;
    characteristicUuid?: string | null;
}
export interface GattTarget {
    serviceUuid: string;
    characteristicUuid: string;
    notify: boolean;
}
export interface ConnectionPolicy {
    maxRetries: number;
    baseDelayMs: number;
    maxDelayMs: number;
}
export declare const defaultConnectionPolicy: () => ConnectionPolicy;
//# sourceMappingURL=model.d.ts.map