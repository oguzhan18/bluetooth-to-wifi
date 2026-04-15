import noble from "@abandonware/noble";
import type { Peripheral } from "@abandonware/noble";
import type { BleAdvertisement } from "../model.js";

function toBuffer(v: unknown): Buffer {
  if (Buffer.isBuffer(v)) return v;
  if (v instanceof Uint8Array) return Buffer.from(v);
  if (v instanceof ArrayBuffer) return Buffer.from(v);
  throw new TypeError("manufacturer data value");
}

type NobleMod = typeof noble & { state: string };

function nobleMod(): NobleMod {
  return noble as NobleMod;
}

function waitPoweredOn(): Promise<void> {
  if (nobleMod().state === "poweredOn") return Promise.resolve();
  return new Promise((resolve, reject) => {
    const to = setTimeout(() => reject(new Error("BLE adapter not powered on")), 30000);
    noble.once("stateChange", (s: string) => {
      if (s === "poweredOn") {
        clearTimeout(to);
        resolve();
      }
    });
  });
}

function mapPeripheral(peripheral: Peripheral): BleAdvertisement {
  const manufacturerData = new Map<number, Buffer>();
  const raw = peripheral.advertisement.manufacturerData;
  if (raw && typeof raw === "object") {
    for (const [k, v] of Object.entries(raw)) {
      const buf = toBuffer(v);
      manufacturerData.set(Number(k), buf);
    }
  }
  const adv = peripheral.advertisement;
  const uuids = (adv.serviceUuids ?? []).map((u) => String(u).toLowerCase());
  const name = adv.localName ?? null;
  return {
    address: peripheral.address,
    name,
    rssi: Number.isFinite(peripheral.rssi) ? peripheral.rssi : null,
    manufacturerData,
    serviceUuids: uuids,
  };
}

export class BleStack {
  async scan(options: {
    durationMs: number;
    filter?: (a: BleAdvertisement) => boolean;
  }): Promise<BleAdvertisement[]> {
    await waitPoweredOn();
    const out: BleAdvertisement[] = [];
    const seen = new Set<string>();

    await new Promise<void>((resolve, reject) => {
      const t = setTimeout(() => {
        noble.removeListener("discover", onDiscover);
        noble.stopScanning();
        resolve();
      }, options.durationMs);

      const onDiscover = (peripheral: Peripheral) => {
        const adv = mapPeripheral(peripheral);
        if (options.filter && !options.filter(adv)) return;
        if (seen.has(adv.address)) return;
        seen.add(adv.address);
        out.push(adv);
      };

      noble.on("discover", onDiscover);
      noble.startScanning([], false, (err?: Error) => {
        if (err) {
          clearTimeout(t);
          noble.removeListener("discover", onDiscover);
          reject(err);
        }
      });
    });

    return out;
  }
}
