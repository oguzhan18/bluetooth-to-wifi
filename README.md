# bluetooth-to-wifi

[![CI](https://github.com/oguzhan18/bluetooth-to-wifi/actions/workflows/ci.yml/badge.svg)](https://github.com/oguzhan18/bluetooth-to-wifi/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)

**Bridge Bluetooth Low Energy (BLE) devices to WiFi-side transports** using one shared JSON envelope. Ships as **Python** libraries, **Node.js** packages, and an **ESP32** firmware reference implementation.

---

## Translations

The canonical technical documentation is **English** (this file). Click a language to open the localized overview (same repository).

| Turkic & regional | Other languages |
|-------------------|-----------------|
| [Türkçe (Turkey)](docs/i18n/README.tr.md) | [Русский](docs/i18n/README.ru.md) |
| [Oʻzbekcha](docs/i18n/README.uz.md) | [Deutsch](docs/i18n/README.de.md) |
| [Azərbaycan](docs/i18n/README.az.md) | [Français](docs/i18n/README.fr.md) |
| [Кыргызча](docs/i18n/README.ky.md) | [Italiano](docs/i18n/README.it.md) |
| [Türkmençe](docs/i18n/README.tk.md) | [Nederlands](docs/i18n/README.nl.md) |
| [Саха тыла (Yakutia)](docs/i18n/README.sah.md) | |

---

## Table of contents

- [Why this project](#why-this-project)
- [Architecture](#architecture)
- [Device envelope (JSON)](#device-envelope-json)
- [Repository layout](#repository-layout)
- [Quick start](#quick-start)
- [Configuration examples](#configuration-examples)
- [Docker](#docker)
- [Publishing packages](#publishing-packages)
- [BLE reliability notes](#ble-reliability-notes)
- [Contributing & security](#contributing--security)
- [License](#license)

---

## Why this project

Consumer and industrial BLE peripherals often expose **GATT characteristics** (temperature, switches, sensors). To integrate them with **home automation, cloud APIs, or MQTT brokers** over WiFi, you need a consistent **normalization layer** and **transport adapters**. This monorepo provides:

| Capability | Python | Node.js | ESP32 |
|------------|--------|---------|-------|
| Scan & connect | ✓ (Bleak) | ✓ (Noble, Linux typical) | ✓ (NimBLE) |
| Parse payloads | ✓ registry | ✓ registry | raw → envelope |
| HTTP / WebSocket / MQTT | ✓ | ✓ | HTTP POST |

---

## Architecture

```text
┌─────────────┐    ┌──────────────┐    ┌─────────────────────────────┐
│  BLE device │───▶│  Core layer  │───▶│  Bridge: JSON envelope      │
│  (GATT)     │    │  scan/GATT   │    │  sinks: HTTP / WS / MQTT    │
└─────────────┘    └──────────────┘    └──────────────┬──────────────┘
                                                     │
                                                     ▼
                                        ┌─────────────────────────────┐
                                        │  WiFi API: ingest + stream   │
                                        │  POST /v1/ingest, WS, MQTT   │
                                        └─────────────────────────────┘
```

| Layer | Role |
|-------|------|
| **Core** | BLE scan/connect, GATT read/notify, pluggable parsers (e.g. temperature, humidity). |
| **Bridge** | Map readings to a **versioned JSON envelope** and forward to sinks. |
| **API** | REST ingest, WebSocket fan-out, optional MQTT republish. |

Schema: [`schemas/device-envelope.schema.json`](schemas/device-envelope.schema.json).

---

## Device envelope (JSON)

All runtimes aim to produce objects compatible with the schema. Minimal example:

```json
{
  "schema_version": 1,
  "source": { "runtime": "python", "bridge_id": "home-bridge-1", "adapter": null },
  "device": {
    "address": "AA:BB:CC:DD:EE:FF",
    "name": "Sensor",
    "manufacturer_data_hex": null,
    "service_uuids": ["0000180a-0000-1000-8000-00805f9b34fb"]
  },
  "payload": {
    "kind": "temperature_c",
    "data": { "value": 23.5, "unit": "celsius" },
    "characteristic_uuid": "00002a6e-0000-1000-8000-00805f9b34fb"
  },
  "timestamp_ms": 1713200000000,
  "rssi": -62
}
```

**Ingest into the Python API** (after the server is running; run from the **repository root**):

```bash
curl -sS -X POST http://127.0.0.1:8765/v1/ingest \
  -H 'Content-Type: application/json' \
  -d @examples/example-envelope.json
```

---

## Repository layout

```text
bluetooth-to-wifi/
├── schemas/                 # JSON Schema (device envelope)
├── packages/python/         # btw-core, btw-bridge, btw-api (PyPI-oriented)
├── packages/nodejs/         # @btw/core, @btw/bridge, @btw/api
├── firmware/esp32/          # ESP-IDF app (NimBLE + WiFi + HTTP)
├── docker/                  # Container image for btw-api (Python)
├── deploy/                  # e.g. Mosquitto config for compose
└── docs/i18n/               # Translated READMEs
```

---

## Quick start

### Python (recommended for desktop / Raspberry Pi)

```bash
cd packages/python
python3.12 -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -e ./btw_core -e ./btw_bridge -e ./btw_api
btw-api --host 0.0.0.0 --port 8765
```

Optional MQTT from the same process:

```bash
export BTW_MQTT_HOST=127.0.0.1 BTW_MQTT_PORT=1883 BTW_MQTT_TOPIC=btw/devices
btw-api --host 0.0.0.0 --port 8765
```

**BLE → HTTP gateway** (example CLI):

```bash
export BTW_BLE_ADDRESS="AA:BB:CC:DD:EE:FF"
export BTW_HTTP_URL="http://127.0.0.1:8765/v1/ingest"
btw-gw
```

### Node.js

Use **Linux + BlueZ** for native BLE via Noble. For TypeScript builds without compiling native addons: `npm install --ignore-scripts`.

```bash
cd packages/nodejs
npm install
npm run build -w @btw/core -w @btw/bridge -w @btw/api
BTW_PORT=8765 node packages/api/dist/cli.js --host 0.0.0.0 --port 8765
```

CLI help:

```bash
node packages/api/dist/cli.js --help
```

### ESP32

See [`firmware/esp32/README.md`](firmware/esp32/README.md). Configure WiFi, target BLE address, and characteristic UUID in `menuconfig`, then:

```bash
idf.py set-target esp32
idf.py menuconfig
idf.py build flash monitor
```

---

## Configuration examples

| Variable / setting | Purpose |
|--------------------|---------|
| `BTW_HOST`, `BTW_PORT` | Python/Node API bind address. |
| `BTW_MQTT_HOST`, `BTW_MQTT_PORT`, `BTW_MQTT_TOPIC`, `BTW_MQTT_USER`, `BTW_MQTT_PASSWORD` | Optional MQTT republish (Python API). |
| `BTW_BLE_ADDRESS`, `BTW_HTTP_URL` | `btw-gw` CLI (Python). |
| ESP `menuconfig` | `BTW_WIFI_*`, `BTW_HTTP_URL`, `BTW_BLE_TARGET_ADDR`, `BTW_CHAR_UUID`, optional `BTW_SERVICE_UUID`. |

---

## Docker

```bash
docker compose up --build
```

- **Mosquitto** on port `1883`
- **btw-api** (Python) on port `8765`, with MQTT republish if env vars are set in `docker-compose.yml`

Adjust image build context in [`docker-compose.yml`](docker-compose.yml) if you fork the repo.

---

## Publishing packages

| Ecosystem | Steps |
|-----------|--------|
| **PyPI** | Install `build` + `twine`. Build and upload in order: `btw-core` → `btw-bridge` → `btw-api`. |
| **npm** | In published packages, replace `file:../core` style deps with semver ranges, then `npm publish` per workspace package. |

See also [`CONTRIBUTING.md`](CONTRIBUTING.md) and [`CHANGELOG.md`](CHANGELOG.md).

---

## BLE reliability notes

- Use **exponential backoff** on disconnect (implemented in gateways / firmware where applicable).
- Serialize **GATT operations** per connection if your stack requires it.
- **Parse in the core**; downstream only sees envelopes.

---

## Contributing & security

- [Contributing](CONTRIBUTING.md)
- [Security policy](SECURITY.md)

---

## License

[MIT](LICENSE)

---

## GitHub

See [docs/GITHUB.md](docs/GITHUB.md) for first push, badge URL, and repository hygiene.
