import mqtt from "mqtt";
import type { DeviceEnvelope } from "../envelope.js";
import type { MqttClient } from "mqtt";

export class MqttSink {
  private client: MqttClient | null = null;

  constructor(
    private readonly url: string,
    private readonly topic: string,
  ) {}

  async open(): Promise<void> {
    if (this.client) return;
    this.client = await new Promise<MqttClient>((resolve, reject) => {
      const c = mqtt.connect(this.url);
      c.once("connect", () => resolve(c));
      c.once("error", reject);
    });
  }

  async emit(envelope: DeviceEnvelope): Promise<void> {
    if (!this.client) await this.open();
    await new Promise<void>((resolve, reject) => {
      this.client!.publish(this.topic, JSON.stringify(envelope), { qos: 1 }, (e) =>
        e ? reject(e) : resolve(),
      );
    });
  }

  async close(): Promise<void> {
    await new Promise<void>((res) => {
      if (!this.client) return res();
      this.client.end(false, {}, () => res());
    });
    this.client = null;
  }
}
