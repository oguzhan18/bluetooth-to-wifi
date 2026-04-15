import noble from "@abandonware/noble";
import { defaultConnectionPolicy } from "../model.js";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function waitPoweredOn() {
    if (noble.state === "poweredOn")
        return Promise.resolve();
    return new Promise((resolve, reject) => {
        const to = setTimeout(() => reject(new Error("BLE adapter not powered on")), 30000);
        noble.once("stateChange", (s) => {
            if (s === "poweredOn") {
                clearTimeout(to);
                resolve();
            }
        });
    });
}
function normUuid(u) {
    return u.replace(/-/g, "").toLowerCase();
}
async function discoverCharacteristics(peripheral) {
    const services = await new Promise((resolve, reject) => {
        peripheral.discoverServices([], (e, svcs) => (e ? reject(e) : resolve(svcs)));
    });
    const all = [];
    for (const s of services) {
        const chs = await new Promise((resolve, reject) => {
            s.discoverCharacteristics([], (e, cc) => (e ? reject(e) : resolve(cc)));
        });
        all.push(...chs);
    }
    return all;
}
export class BleSession {
    address;
    peripheral = null;
    policy;
    constructor(address, policy) {
        this.address = address;
        this.policy = policy ?? defaultConnectionPolicy();
    }
    async connect() {
        await waitPoweredOn();
        let delay = this.policy.baseDelayMs;
        let last;
        for (let i = 0; i < this.policy.maxRetries; i++) {
            try {
                const p = await new Promise((resolve, reject) => {
                    const t = setTimeout(() => {
                        noble.removeListener("discover", onDiscover);
                        noble.stopScanning();
                        reject(new Error("connect scan timeout"));
                    }, 20000);
                    const onDiscover = (per) => {
                        if (per.address.toLowerCase() !== this.address.toLowerCase())
                            return;
                        clearTimeout(t);
                        noble.removeListener("discover", onDiscover);
                        noble.stopScanning();
                        per.connect((err) => (err ? reject(err) : resolve(per)));
                    };
                    noble.on("discover", onDiscover);
                    noble.startScanning([], false);
                });
                this.peripheral = p;
                return;
            }
            catch (e) {
                last = e instanceof Error ? e : new Error(String(e));
                await sleep(delay);
                delay = Math.min(delay * 2, this.policy.maxDelayMs);
            }
        }
        throw last ?? new Error("connect failed");
    }
    async disconnect() {
        const p = this.peripheral;
        this.peripheral = null;
        if (!p)
            return;
        await new Promise((res) => p.disconnect(() => res()));
    }
    requireConnected() {
        if (!this.peripheral || this.peripheral.state !== "connected") {
            throw new Error("not connected");
        }
        return this.peripheral;
    }
    async readGatt(target) {
        const p = this.requireConnected();
        const characteristics = await discoverCharacteristics(p);
        const ch = characteristics.find((c) => normUuid(c.uuid) === normUuid(target.characteristicUuid));
        if (!ch)
            throw new Error("characteristic not found");
        return await new Promise((resolve, reject) => {
            ch.read((e, d) => (e ? reject(e) : resolve(d)));
        });
    }
    async notifyStream(target) {
        if (!target.notify)
            throw new Error("notify must be true");
        const p = this.requireConnected();
        const characteristics = await discoverCharacteristics(p);
        const ch = characteristics.find((c) => normUuid(c.uuid) === normUuid(target.characteristicUuid));
        if (!ch)
            throw new Error("characteristic not found");
        const q = [];
        const waiters = [];
        const push = (b) => {
            const w = waiters.shift();
            if (w)
                w(b);
            else
                q.push(b);
        };
        await new Promise((resolve, reject) => {
            ch.subscribe((e) => (e ? reject(e) : resolve()));
        });
        ch.on("data", (d) => push(d));
        async function* gen() {
            while (true) {
                if (q.length) {
                    yield q.shift();
                    continue;
                }
                yield await new Promise((r) => waiters.push(r));
            }
        }
        return {
            stop: async () => {
                await new Promise((resolve, reject) => {
                    ch.unsubscribe((e) => (e ? reject(e) : resolve()));
                });
            },
            queue: gen(),
        };
    }
}
//# sourceMappingURL=session.js.map