import WebSocket from "ws";
export class WebSocketSink {
    uri;
    ws = null;
    connecting = null;
    constructor(uri) {
        this.uri = uri;
    }
    async ensure() {
        if (this.ws && this.ws.readyState === WebSocket.OPEN)
            return this.ws;
        if (this.connecting) {
            await this.connecting;
            if (this.ws && this.ws.readyState === WebSocket.OPEN)
                return this.ws;
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
        if (!this.ws)
            throw new Error("ws failed");
        return this.ws;
    }
    async emit(envelope) {
        const ws = await this.ensure();
        ws.send(JSON.stringify(envelope));
    }
    async close() {
        this.ws?.close();
        this.ws = null;
    }
}
//# sourceMappingURL=ws.js.map