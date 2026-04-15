import type { DeviceEnvelope } from "./envelope.js";

export interface EnvelopeSink {
  emit(envelope: DeviceEnvelope): Promise<void>;
  close(): Promise<void>;
}

export class BridgePipeline {
  constructor(private readonly sinks: EnvelopeSink[]) {}

  async forward(envelope: DeviceEnvelope): Promise<void> {
    await Promise.all(this.sinks.map((s) => s.emit(envelope)));
  }

  async close(): Promise<void> {
    await Promise.all(this.sinks.map((s) => s.close()));
  }
}
