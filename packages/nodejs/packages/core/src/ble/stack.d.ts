import type { BleAdvertisement } from "../model.js";
export declare class BleStack {
    scan(options: {
        durationMs: number;
        filter?: (a: BleAdvertisement) => boolean;
    }): Promise<BleAdvertisement[]>;
}
//# sourceMappingURL=stack.d.ts.map