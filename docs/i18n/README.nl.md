# bluetooth-to-wifi — Nederlands (NL/BE)

[← English documentation](../../README.md)

Open-source monorepo om **BLE-apparaten naar de WiFi-kant** te brengen (HTTP, WebSocket, MQTT). Ondersteunt **Python**, **Node.js** en **ESP32** (ESP-IDF).

## Andere talen

[Türkçe](README.tr.md) · [Oʻzbekcha](README.uz.md) · [Azərbaycan](README.az.md) · [Кыргызча](README.ky.md) · [Türkmençe](README.tk.md) · [Саха тыла](README.sah.md) · [Русский](README.ru.md) · [Deutsch](README.de.md) · [Français](README.fr.md) · [Italiano](README.it.md)

## Snelstart (Python)

```bash
cd packages/python
python3 -m venv .venv && source .venv/bin/activate
pip install -e ./btw_core -e ./btw_bridge -e ./btw_api
btw-api --host 0.0.0.0 --port 8765
```

Voorbeeld-envelope versturen (vanuit de repository-root):

```bash
curl -sS -X POST http://127.0.0.1:8765/v1/ingest \
  -H 'Content-Type: application/json' \
  -d @examples/example-envelope.json
```

Volledige documentatie: [English README](../../README.md). ESP32: [`firmware/esp32/README.md`](../../firmware/esp32/README.md).

## Licentie

[MIT](../../LICENSE)
