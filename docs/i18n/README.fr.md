# bluetooth-to-wifi — Français

[← English documentation](../../README.md)

Monorepo open source pour **relier le BLE au WiFi** (HTTP, WebSocket, MQTT). Prise en charge de **Python**, **Node.js** et **ESP32** (ESP-IDF).

## Autres langues

[Türkçe](README.tr.md) · [Oʻzbekcha](README.uz.md) · [Azərbaycan](README.az.md) · [Кыргызча](README.ky.md) · [Türkmençe](README.tk.md) · [Саха тыла](README.sah.md) · [Русский](README.ru.md) · [Deutsch](README.de.md) · [Italiano](README.it.md) · [Nederlands](README.nl.md)

## Démarrage rapide (Python)

```bash
cd packages/python
python3 -m venv .venv && source .venv/bin/activate
pip install -e ./btw_core -e ./btw_bridge -e ./btw_api
btw-api --host 0.0.0.0 --port 8765
```

Exemple d’envoi d’enveloppe (depuis la racine du dépôt) :

```bash
curl -sS -X POST http://127.0.0.1:8765/v1/ingest \
  -H 'Content-Type: application/json' \
  -d @examples/example-envelope.json
```

Documentation complète : [English README](../../README.md). ESP32 : [`firmware/esp32/README.md`](../../firmware/esp32/README.md).

## Licence

[MIT](../../LICENSE)
