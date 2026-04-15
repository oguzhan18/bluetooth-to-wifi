import noble from "@abandonware/noble";
import type { Characteristic, Peripheral, Service } from "@abandonware/noble";
import { defaultConnectionPolicy, type ConnectionPolicy, type GattTarget } from "../model.js";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

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

function normUuid(u: string): string {
  return u.replace(/-/g, "").toLowerCase();
}

async function discoverCharacteristics(peripheral: Peripheral): Promise<Characteristic[]> {
  const services = await new Promise<Service[]>((resolve, reject) => {
    peripheral.discoverServices([], (e, svcs) => (e ? reject(e) : resolve(svcs)));
  });
  const all: Characteristic[] = [];
  for (const s of services) {
    const chs = await new Promise<Characteristic[]>((resolve, reject) => {
      s.discoverCharacteristics([], (e, cc) => (e ? reject(e) : resolve(cc)));
    });
    all.push(...chs);
  }
  return all;
}

export class BleSession {
  private peripheral: Peripheral | null = null;
  private policy: ConnectionPolicy;

  constructor(
    readonly address: string,
    policy?: ConnectionPolicy,
  ) {
    this.policy = policy ?? defaultConnectionPolicy();
  }

  async connect(): Promise<void> {
    await waitPoweredOn();
    let delay = this.policy.baseDelayMs;
    let last: Error | undefined;
    for (let i = 0; i < this.policy.maxRetries; i++) {
      try {
        const p = await new Promise<Peripheral>((resolve, reject) => {
          const t = setTimeout(() => {
            noble.removeListener("discover", onDiscover);
            noble.stopScanning();
            reject(new Error("connect scan timeout"));
          }, 20000);

          const onDiscover = (per: Peripheral) => {
            if (per.address.toLowerCase() !== this.address.toLowerCase()) return;
            clearTimeout(t);
            noble.removeListener("discover", onDiscover);
            noble.stopScanning();
            per.connect((err: string) => (err ? reject(new Error(err)) : resolve(per)));
          };

          noble.on("discover", onDiscover);
          noble.startScanning([], false);
        });
        this.peripheral = p;
        return;
      } catch (e) {
        last = e instanceof Error ? e : new Error(String(e));
        await sleep(delay);
        delay = Math.min(delay * 2, this.policy.maxDelayMs);
      }
    }
    throw last ?? new Error("connect failed");
  }

  async disconnect(): Promise<void> {
    const p = this.peripheral;
    this.peripheral = null;
    if (!p) return;
    await new Promise<void>((res) => p.disconnect(() => res()));
  }

  private requireConnected(): Peripheral {
    if (!this.peripheral || this.peripheral.state !== "connected") {
      throw new Error("not connected");
    }
    return this.peripheral;
  }

  async readGatt(target: GattTarget): Promise<Buffer> {
    const p = this.requireConnected();
    const characteristics = await discoverCharacteristics(p);
    const ch = characteristics.find((c) => normUuid(c.uuid) === normUuid(target.characteristicUuid));
    if (!ch) throw new Error("characteristic not found");
    return await new Promise<Buffer>((resolve, reject) => {
      ch.read((e, d) => (e ? reject(e) : resolve(d as Buffer)));
    });
  }

  async notifyStream(
    target: GattTarget,
  ): Promise<{ stop: () => Promise<void>; queue: AsyncIterable<Buffer> }> {
    if (!target.notify) throw new Error("notify must be true");
    const p = this.requireConnected();
    const characteristics = await discoverCharacteristics(p);
    const ch = characteristics.find((c) => normUuid(c.uuid) === normUuid(target.characteristicUuid));
    if (!ch) throw new Error("characteristic not found");

    const q: Buffer[] = [];
    const waiters: Array<(v: Buffer) => void> = [];

    const push = (b: Buffer) => {
      const w = waiters.shift();
      if (w) w(b);
      else q.push(b);
    };

    await new Promise<void>((resolve, reject) => {
      ch.subscribe((e) => (e ? reject(e) : resolve()));
    });

    ch.on("data", (d: Buffer) => push(d));

    async function* gen(): AsyncIterable<Buffer> {
      while (true) {
        if (q.length) {
          yield q.shift()!;
          continue;
        }
        yield await new Promise<Buffer>((r) => waiters.push(r));
      }
    }

    return {
      stop: async () => {
        await new Promise<void>((resolve, reject) => {
          ch.unsubscribe((e) => (e ? reject(e) : resolve()));
        });
      },
      queue: gen(),
    };
  }
}
