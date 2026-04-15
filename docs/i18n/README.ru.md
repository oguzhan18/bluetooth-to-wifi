# bluetooth-to-wifi — Русский

[← English documentation](../../README.md)

Монорепозиторий с открытым исходным кодом для моста **BLE → WiFi** (HTTP, WebSocket, MQTT). Поддерживаются **Python**, **Node.js** и прошивка **ESP32** (ESP-IDF).

## Другие языки

[Türkçe](README.tr.md) · [Oʻzbekcha](README.uz.md) · [Azərbaycan](README.az.md) · [Кыргызча](README.ky.md) · [Türkmençe](README.tk.md) · [Саха тыла](README.sah.md) · [Deutsch](README.de.md) · [Français](README.fr.md) · [Italiano](README.it.md) · [Nederlands](README.nl.md)

## Быстрый старт (Python)

```bash
cd packages/python
python3 -m venv .venv && source .venv/bin/activate
pip install -e ./btw_core -e ./btw_bridge -e ./btw_api
btw-api --host 0.0.0.0 --port 8765
```

Пример отправки конверта (из корня репозитория):

```bash
curl -sS -X POST http://127.0.0.1:8765/v1/ingest \
  -H 'Content-Type: application/json' \
  -d @examples/example-envelope.json
```

Полная документация: [English README](../../README.md). ESP32: [`firmware/esp32/README.md`](../../firmware/esp32/README.md).

## Лицензия

[MIT](../../LICENSE)
