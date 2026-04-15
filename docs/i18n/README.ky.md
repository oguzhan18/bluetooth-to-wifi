# bluetooth-to-wifi — Кыргызча

[← English documentation](../../README.md)

BLE түзмөктөрүн WiFi аркылуу HTTP, WebSocket жана MQTTга туташтыруу үчүн ачык булак монорепо. **Python**, **Node.js** жана **ESP32** колдоосу бар.

## Башка тилдер

[Türkçe](README.tr.md) · [Oʻzbekcha](README.uz.md) · [Azərbaycan](README.az.md) · [Türkmençe](README.tk.md) · [Саха тыла](README.sah.md) · [Русский](README.ru.md) · [Deutsch](README.de.md) · [Français](README.fr.md) · [Italiano](README.it.md) · [Nederlands](README.nl.md)

## Тез баштоо (Python)

```bash
cd packages/python
python3 -m venv .venv && source .venv/bin/activate
pip install -e ./btw_core -e ./btw_bridge -e ./btw_api
btw-api --host 0.0.0.0 --port 8765
```

Толук документация: [English README](../../README.md). ESP32: [`firmware/esp32/README.md`](../../firmware/esp32/README.md).

## Лицензия

[MIT](../../LICENSE)
