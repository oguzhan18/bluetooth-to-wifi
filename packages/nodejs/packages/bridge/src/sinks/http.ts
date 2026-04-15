import type { DeviceEnvelope } from "../envelope.js";

export class HttpSink {
  constructor(
    private readonly url: string,
    private readonly fetchFn: typeof fetch = fetch,
  ) {}

  async emit(envelope: DeviceEnvelope): Promise<void> {
    const body = JSON.stringify(envelope);
    const res = await this.fetchFn(this.url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
    });
    if (!res.ok) throw new Error(`http sink ${res.status}`);
  }

  async close(): Promise<void> {}
}
