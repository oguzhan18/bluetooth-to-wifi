import type { BleAdvertisement, DeviceReading } from "@btw/core";
import { z } from "zod";
export declare const payloadKindSchema: z.ZodEnum<["temperature_c", "humidity_pct", "switch", "binary_sensor", "raw_bytes", "generic"]>;
export declare const deviceEnvelopeSchema: z.ZodObject<{
    schema_version: z.ZodLiteral<1>;
    source: z.ZodObject<{
        runtime: z.ZodEnum<["python", "nodejs", "esp32"]>;
        bridge_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        adapter: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        runtime: "python" | "nodejs" | "esp32";
        bridge_id?: string | null | undefined;
        adapter?: string | null | undefined;
    }, {
        runtime: "python" | "nodejs" | "esp32";
        bridge_id?: string | null | undefined;
        adapter?: string | null | undefined;
    }>;
    device: z.ZodObject<{
        address: z.ZodString;
        name: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        manufacturer_data_hex: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        service_uuids: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        address: string;
        service_uuids: string[];
        name?: string | null | undefined;
        manufacturer_data_hex?: string | null | undefined;
    }, {
        address: string;
        service_uuids: string[];
        name?: string | null | undefined;
        manufacturer_data_hex?: string | null | undefined;
    }>;
    payload: z.ZodObject<{
        kind: z.ZodEnum<["temperature_c", "humidity_pct", "switch", "binary_sensor", "raw_bytes", "generic"]>;
        data: z.ZodRecord<z.ZodString, z.ZodUnknown>;
        characteristic_uuid: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        kind: "temperature_c" | "humidity_pct" | "switch" | "binary_sensor" | "raw_bytes" | "generic";
        data: Record<string, unknown>;
        characteristic_uuid?: string | null | undefined;
    }, {
        kind: "temperature_c" | "humidity_pct" | "switch" | "binary_sensor" | "raw_bytes" | "generic";
        data: Record<string, unknown>;
        characteristic_uuid?: string | null | undefined;
    }>;
    timestamp_ms: z.ZodNumber;
    rssi: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    schema_version: 1;
    source: {
        runtime: "python" | "nodejs" | "esp32";
        bridge_id?: string | null | undefined;
        adapter?: string | null | undefined;
    };
    device: {
        address: string;
        service_uuids: string[];
        name?: string | null | undefined;
        manufacturer_data_hex?: string | null | undefined;
    };
    payload: {
        kind: "temperature_c" | "humidity_pct" | "switch" | "binary_sensor" | "raw_bytes" | "generic";
        data: Record<string, unknown>;
        characteristic_uuid?: string | null | undefined;
    };
    timestamp_ms: number;
    rssi?: number | null | undefined;
}, {
    schema_version: 1;
    source: {
        runtime: "python" | "nodejs" | "esp32";
        bridge_id?: string | null | undefined;
        adapter?: string | null | undefined;
    };
    device: {
        address: string;
        service_uuids: string[];
        name?: string | null | undefined;
        manufacturer_data_hex?: string | null | undefined;
    };
    payload: {
        kind: "temperature_c" | "humidity_pct" | "switch" | "binary_sensor" | "raw_bytes" | "generic";
        data: Record<string, unknown>;
        characteristic_uuid?: string | null | undefined;
    };
    timestamp_ms: number;
    rssi?: number | null | undefined;
}>;
export type DeviceEnvelope = z.infer<typeof deviceEnvelopeSchema>;
export declare function envelopeFromReading(adv: BleAdvertisement, reading: DeviceReading, meta: {
    bridgeId?: string | null;
    adapter?: string | null;
}): DeviceEnvelope;
//# sourceMappingURL=envelope.d.ts.map