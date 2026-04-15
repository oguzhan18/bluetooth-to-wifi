import mqtt from "mqtt";
export class MqttSink {
    url;
    topic;
    client = null;
    constructor(url, topic) {
        this.url = url;
        this.topic = topic;
    }
    async open() {
        if (this.client)
            return;
        this.client = await new Promise((resolve, reject) => {
            const c = mqtt.connect(this.url);
            c.once("connect", () => resolve(c));
            c.once("error", reject);
        });
    }
    async emit(envelope) {
        if (!this.client)
            await this.open();
        await new Promise((resolve, reject) => {
            this.client.publish(this.topic, JSON.stringify(envelope), { qos: 1 }, (e) => e ? reject(e) : resolve());
        });
    }
    async close() {
        await new Promise((res) => {
            if (!this.client)
                return res();
            this.client.end(false, {}, () => res());
        });
        this.client = null;
    }
}
//# sourceMappingURL=mqtt.js.map