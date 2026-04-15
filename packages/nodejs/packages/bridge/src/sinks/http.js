export class HttpSink {
    url;
    fetchFn;
    constructor(url, fetchFn = fetch) {
        this.url = url;
        this.fetchFn = fetchFn;
    }
    async emit(envelope) {
        const body = JSON.stringify(envelope);
        const res = await this.fetchFn(this.url, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body,
        });
        if (!res.ok)
            throw new Error(`http sink ${res.status}`);
    }
    async close() { }
}
//# sourceMappingURL=http.js.map