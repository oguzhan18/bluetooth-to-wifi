import WebSocket from "ws";
import type { DeviceEnvelope } from "../envelope.js";

export class WebSocketSink {
  private ws: WebSocket | null = null;
  private connecting: Promise<void> | null = null;

  constructor(private readonly uri: string) {}

  private async ensure(): Promise<WebSocket> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return this.ws;
    if (this.connecting) {
      await this.connecting;
      if (this.ws && this.ws.readyState === WebSocket.OPEN) return this.ws;
    }
    this.connecting = new Promise((resolve, reject) => {
      const ws = new WebSocket(this.uri);
      ws.once("open", () => {
        this.ws = ws;
        this.connecting = null;
        resolve();
      });
      ws.once("error", (e) => {
        this.connecting = null;
        reject(e);
      });
    });
    await this.connecting;
    if (!this.ws) throw new Error("ws failed");
    return this.ws;
  }

  async emit(envelope: DeviceEnvelope): Promise<void> {
    const ws = await this.ensure();
    ws.send(JSON.stringify(envelope));
  }

  async close(): Promise<void> {
    this.ws?.close();
    this.ws = null;
  }
}
