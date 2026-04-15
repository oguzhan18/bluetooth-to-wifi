# ESP32 firmware (ESP-IDF)

NimBLE observer (passive scan) plus WiFi STA and periodic HTTP POST of a schema-compliant envelope to `btw-api` or any HTTP sink.

## Requirements

- ESP-IDF v5.2 or newer (`IDF_PATH` set)
- Target: ESP32 / ESP32-C3 with BLE

## Configure

```bash
idf.py set-target esp32
idf.py menuconfig
```

Set **Bluetooth-to-WiFi** menu:

- WiFi SSID / password
- Downstream `BTW_HTTP_URL` (e.g. `http://192.168.1.10:8765/v1/ingest`)
- `BTW_BLE_TARGET_ADDR` (AA:BB:CC:DD:EE:FF)
- `BTW_CHAR_UUID` (notify characteristic UUID)

## Build and flash

```bash
idf.py build flash monitor
```

Once connected, the firmware enables notifications on `BTW_CHAR_UUID` and POSTs each notify payload as `raw_bytes` in the shared envelope schema.

## Reliability notes

- Notifications are queued and posted from a dedicated FreeRTOS task (no HTTP in BLE callbacks).
- Notify payload extraction uses `os_mbuf_copydata` (safe for chained mbufs).
- Queue backpressure uses drop-oldest when full.
- If the device disconnects, scanning resumes automatically.
- WiFi reconnect is event-driven; HTTP worker waits for IP.
- HTTP POST uses a small retry budget (3 attempts).
- If notifications go silent for ~30s after subscription, a watchdog triggers reconnect.
