# bluetooth-to-wifi — Türkçe özet

[← English documentation](../../README.md)

BLE cihazlarını WiFi tarafına (HTTP, WebSocket, MQTT) taşıyan açık kaynak monorepo. **Python**, **Node.js** ve **ESP-IDF** ile aynı JSON zarfı (`schemas/device-envelope.schema.json`).

## Diğer diller

| | |
|---|---|
| [Oʻzbekcha](README.uz.md) | [Русский](README.ru.md) |
| [Azərbaycan](README.az.md) | [Deutsch](README.de.md) |
| [Кыргызча](README.ky.md) | [Français](README.fr.md) |
| [Türkmençe](README.tk.md) | [Italiano](README.it.md) |
| [Саха тыла](README.sah.md) | [Nederlands](README.nl.md) |

## Hızlı başlangıç (Python)

```bash
cd packages/python
python3 -m venv .venv && source .venv/bin/activate
pip install -e ./btw_core -e ./btw_bridge -e ./btw_api
btw-api --host 0.0.0.0 --port 8765
```

Örnek zarf ile gönderim (depo kök dizininden):

```bash
curl -sS -X POST http://127.0.0.1:8765/v1/ingest \
  -H 'Content-Type: application/json' \
  -d @examples/example-envelope.json
```

ESP32 için: [`firmware/esp32/README.md`](../../firmware/esp32/README.md). Docker: kök dizinde `docker compose up --build`.

## Lisans

[MIT](../../LICENSE)
