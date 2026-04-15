export class BridgePipeline {
    sinks;
    constructor(sinks) {
        this.sinks = sinks;
    }
    async forward(envelope) {
        await Promise.all(this.sinks.map((s) => s.emit(envelope)));
    }
    async close() {
        await Promise.all(this.sinks.map((s) => s.close()));
    }
}
//# sourceMappingURL=pipeline.js.map