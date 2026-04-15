import noble from "@abandonware/noble";
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
function mapPeripheral(peripheral) {
    const manufacturerData = new Map();
    const md = peripheral.advertisement.manufacturerData;
    if (md) {
        for (const k of Object.keys(md)) {
            manufacturerData.set(Number(k), md[k]);
        }
    }
    const uuids = (peripheral.advertisement.serviceUuids ?? []).map((u) => String(u).toLowerCase());
    return {
        address: peripheral.address,
        name: peripheral.advertisement.localName ?? peripheral.advertisement.name ?? null,
        rssi: Number.isFinite(peripheral.rssi) ? peripheral.rssi : null,
        manufacturerData,
        serviceUuids: uuids,
    };
}
export class BleStack {
    async scan(options) {
        await waitPoweredOn();
        const out = [];
        const seen = new Set();
        await new Promise((resolve, reject) => {
            const t = setTimeout(() => {
                noble.removeListener("discover", onDiscover);
                noble.stopScanning();
                resolve();
            }, options.durationMs);
            const onDiscover = (peripheral) => {
                const adv = mapPeripheral(peripheral);
                if (options.filter && !options.filter(adv))
                    return;
                if (seen.has(adv.address))
                    return;
                seen.add(adv.address);
                out.push(adv);
            };
            noble.on("discover", onDiscover);
            noble.startScanning([], false, (err) => {
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
//# sourceMappingURL=stack.js.map