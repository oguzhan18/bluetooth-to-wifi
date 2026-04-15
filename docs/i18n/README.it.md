# bluetooth-to-wifi — Italiano

[← English documentation](../../README.md)

Monorepo open source per **collegare dispositivi BLE al lato WiFi** (HTTP, WebSocket, MQTT). Supportati **Python**, **Node.js** e **ESP32** (ESP-IDF).

## Altre lingue

[Türkçe](README.tr.md) · [Oʻzbekcha](README.uz.md) · [Azərbaycan](README.az.md) · [Кыргызча](README.ky.md) · [Türkmençe](README.tk.md) · [Саха тыла](README.sah.md) · [Русский](README.ru.md) · [Deutsch](README.de.md) · [Français](README.fr.md) · [Nederlands](README.nl.md)

## Avvio rapido (Python)

```bash
cd packages/python
python3 -m venv .venv && source .venv/bin/activate
pip install -e ./btw_core -e ./btw_bridge -e ./btw_api
btw-api --host 0.0.0.0 --port 8765
```

Esempio di invio envelope (dalla root del repo):

```bash
curl -sS -X POST http://127.0.0.1:8765/v1/ingest \
  -H 'Content-Type: application/json' \
  -d @examples/example-envelope.json
```

Documentazione completa: [English README](../../README.md). ESP32: [`firmware/esp32/README.md`](../../firmware/esp32/README.md).

## Licenza

[MIT](../../LICENSE)
