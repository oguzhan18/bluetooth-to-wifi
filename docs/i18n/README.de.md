# bluetooth-to-wifi — Deutsch

[← English documentation](../../README.md)

Open-Source-Monorepo zum **Brücken von BLE-Geräten** zu WiFi-seitigen Schnittstellen (HTTP, WebSocket, MQTT). Unterstützt werden **Python**, **Node.js** und **ESP32** (ESP-IDF).

## Weitere Sprachen

[Türkçe](README.tr.md) · [Oʻzbekcha](README.uz.md) · [Azərbaycan](README.az.md) · [Кыргызча](README.ky.md) · [Türkmençe](README.tk.md) · [Саха тыла](README.sah.md) · [Русский](README.ru.md) · [Français](README.fr.md) · [Italiano](README.it.md) · [Nederlands](README.nl.md)

## Schnellstart (Python)

```bash
cd packages/python
python3 -m venv .venv && source .venv/bin/activate
pip install -e ./btw_core -e ./btw_bridge -e ./btw_api
btw-api --host 0.0.0.0 --port 8765
```

Beispiel-Envelope senden (vom Repository-Root):

```bash
curl -sS -X POST http://127.0.0.1:8765/v1/ingest \
  -H 'Content-Type: application/json' \
  -d @examples/example-envelope.json
```

Vollständige Dokumentation: [English README](../../README.md). ESP32: [`firmware/esp32/README.md`](../../firmware/esp32/README.md).

## Lizenz

[MIT](../../LICENSE)
