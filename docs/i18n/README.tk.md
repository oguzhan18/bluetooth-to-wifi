# bluetooth-to-wifi — Türkmençe

[← English documentation](../../README.md)

BLE enjamlaryny WiFi arkaly HTTP, WebSocket we MQTT bilen birleşdirmek üçin açyk çeşme monorepo. **Python**, **Node.js** we **ESP32** goldanylýar.

## Başga diller

[Türkçe](README.tr.md) · [Oʻzbekcha](README.uz.md) · [Azərbaycan](README.az.md) · [Кыргызча](README.ky.md) · [Саха тыла](README.sah.md) · [Русский](README.ru.md) · [Deutsch](README.de.md) · [Français](README.fr.md) · [Italiano](README.it.md) · [Nederlands](README.nl.md)

## Çalt başlaş (Python)

```bash
cd packages/python
python3 -m venv .venv && source .venv/bin/activate
pip install -e ./btw_core -e ./btw_bridge -e ./btw_api
btw-api --host 0.0.0.0 --port 8765
```

Doly resminama: [English README](../../README.md). ESP32: [`firmware/esp32/README.md`](../../firmware/esp32/README.md).

## Ygtyýarnama

[MIT](../../LICENSE)
