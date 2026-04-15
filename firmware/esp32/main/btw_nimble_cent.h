#pragma once

void btw_nimble_start(void);

// Ownership of `data` is transferred to the callee.
void btw_on_notify_owned(const char *addr, int rssi, uint8_t *data, uint16_t len);
