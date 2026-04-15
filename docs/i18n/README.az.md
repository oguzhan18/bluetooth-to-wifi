# bluetooth-to-wifi — Azərbaycan

[← English documentation](../../README.md)

BLE cihazlarını WiFi üzərindən HTTP, WebSocket və MQTT ilə inteqrasiya etmək üçün açıq mənbə monorepo. **Python**, **Node.js** və **ESP-IDF** dəstəyi.

## Digər dillər

[Türkçe](README.tr.md) · [Oʻzbekcha](README.uz.md) · [Кыргызча](README.ky.md) · [Türkmençe](README.tk.md) · [Саха тыла](README.sah.md) · [Русский](README.ru.md) · [Deutsch](README.de.md) · [Français](README.fr.md) · [Italiano](README.it.md) · [Nederlands](README.nl.md)

## Tez başlanğıc (Python)

```bash
cd packages/python
python3 -m venv .venv && source .venv/bin/activate
pip install -e ./btw_core -e ./btw_bridge -e ./btw_api
btw-api --host 0.0.0.0 --port 8765
```

Ətraflı sənədlər: [English README](../../README.md). ESP32: [`firmware/esp32/README.md`](../../firmware/esp32/README.md).

## Lisenziya

[MIT](../../LICENSE)
