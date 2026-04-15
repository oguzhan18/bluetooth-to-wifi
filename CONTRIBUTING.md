## Contributing

### Goals

- Cross-runtime parity (Python / Node.js / ESP32) for the JSON envelope schema.
- Stability first: reconnect loops, bounded queues, idempotent sinks.
- Minimal comments; prefer self-explanatory names and small modules.

### Development

- **Python**: use Python 3.10+ (3.12 recommended).
- **Node.js**: use Node 20+ (Linux recommended for BLE).
- **ESP32**: ESP-IDF 5.2+.

### Pull requests

- Add tests when changing parsers or envelope shape.
- Keep public APIs backward-compatible within a minor line.
- Avoid adding heavyweight dependencies.

### Translations

Short locale overviews are in [`docs/i18n/`](docs/i18n/). If you change install steps, API paths, or the envelope format in the English [`README.md`](README.md), update the affected locale files in the same PR when possible.

