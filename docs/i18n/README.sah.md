# bluetooth-to-wifi — Саха тыла (Ыкыттан)

[← English documentation](../../README.md)

BLE тэрилэргэ WiFi аны HTTP, WebSocket уонна MQTT көмөтөһүү — аһаҕас төрүт монорепо. **Python**, **Node.js** уонна **ESP32** көмөлөһөө.

## Атын тыллар

[Türkçe](README.tr.md) · [Oʻzbekcha](README.uz.md) · [Azərbaycan](README.az.md) · [Кыргызча](README.ky.md) · [Türkmençe](README.tk.md) · [Русский](README.ru.md) · [Deutsch](README.de.md) · [Français](README.fr.md) · [Italiano](README.it.md) · [Nederlands](README.nl.md)

## Кылаһыы (Python)

```bash
cd packages/python
python3 -m venv .venv && source .venv/bin/activate
pip install -e ./btw_core -e ./btw_bridge -e ./btw_api
btw-api --host 0.0.0.0 --port 8765
```

Толору документация: [English README](../../README.md). ESP32: [`firmware/esp32/README.md`](../../firmware/esp32/README.md).

## Лицензия

[MIT](../../LICENSE)
