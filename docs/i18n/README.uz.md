# bluetooth-to-wifi — Oʻzbekcha

[← English documentation](../../README.md)

BLE qurilmalarini WiFi orqali HTTP, WebSocket va MQTT ga ulash uchun ochiq manba loyiha. **Python**, **Node.js** va **ESP32** qo‘llab-quvvatlanadi.

## Boshqa tillar

[Türkçe](README.tr.md) · [Azərbaycan](README.az.md) · [Кыргызча](README.ky.md) · [Türkmençe](README.tk.md) · [Саха тыла](README.sah.md) · [Русский](README.ru.md) · [Deutsch](README.de.md) · [Français](README.fr.md) · [Italiano](README.it.md) · [Nederlands](README.nl.md)

## Tez boshlash (Python)

```bash
cd packages/python
python3 -m venv .venv && source .venv/bin/activate
pip install -e ./btw_core -e ./btw_bridge -e ./btw_api
btw-api --host 0.0.0.0 --port 8765
```

To‘liq hujjat: [English README](../../README.md). ESP32: [`firmware/esp32/README.md`](../../firmware/esp32/README.md).

## Litsenziya

[MIT](../../LICENSE)
