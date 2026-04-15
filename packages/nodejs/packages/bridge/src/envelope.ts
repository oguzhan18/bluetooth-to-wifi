import type { BleAdvertisement, DeviceReading } from "@btw/core";
import { z } from "zod";

export const payloadKindSchema = z.enum([
  "temperature_c",
  "humidity_pct",
  "switch",
  "binary_sensor",
  "raw_bytes",
  "generic",
]);

export const deviceEnvelopeSchema = z.object({
  schema_version: z.literal(1),
  source: z.object({
    runtime: z.enum(["python", "nodejs", "esp32"]),
    bridge_id: z.string().nullable().optional(),
    adapter: z.string().nullable().optional(),
  }),
  device: z.object({
    address: z.string(),
    name: z.string().nullable().optional(),
    manufacturer_data_hex: z.string().nullable().optional(),
    service_uuids: z.array(z.string()),
  }),
  payload: z.object({
    kind: payloadKindSchema,
    data: z.record(z.unknown()),
    characteristic_uuid: z.string().nullable().optional(),
  }),
  timestamp_ms: z.number().int().nonnegative(),
  rssi: z.number().int().nullable().optional(),
});

export type DeviceEnvelope = z.infer<typeof deviceEnvelopeSchema>;

export function envelopeFromReading(
  adv: BleAdvertisement,
  reading: DeviceReading,
  meta: { bridgeId?: string | null; adapter?: string | null },
): DeviceEnvelope {
  let manufacturerHex: string | null = null;
  if (adv.manufacturerData.size) {
    const parts = [...adv.manufacturerData.entries()].sort((a, b) => a[0] - b[0]);
    manufacturerHex = Buffer.concat(parts.map(([, b]) => b)).toString("hex");
  }
  return {
    schema_version: 1,
    source: {
      runtime: "nodejs",
      bridge_id: meta.bridgeId ?? null,
      adapter: meta.adapter ?? null,
    },
    device: {
      address: adv.address,
      name: adv.name,
      manufacturer_data_hex: manufacturerHex,
      service_uuids: adv.serviceUuids,
    },
    payload: {
      kind: reading.kind as DeviceEnvelope["payload"]["kind"],
      data: reading.data,
      characteristic_uuid: reading.characteristicUuid ?? null,
    },
    timestamp_ms: Date.now(),
    rssi: adv.rssi,
  };
}
