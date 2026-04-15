#include "btw_nimble_cent.h"

#include <ctype.h>
#include <stdlib.h>
#include <string.h>

#include "esp_log.h"
#include "esp_timer.h"
#include "nimble/nimble_port.h"
#include "nimble/nimble_port_freertos.h"
#include "host/ble_hs.h"
#include "host/util/util.h"
#include "os/os_mbuf.h"
#include "services/gap/ble_svc_gap.h"
#include "esp_nimble_hci.h"
#include "host/ble_gap.h"
#include "host/ble_gattc.h"
#include "host/ble_uuid.h"

#include "sdkconfig.h"

static const char *TAG = "btw_nimble";

static void on_reset(int reason) {
  ESP_LOGE(TAG, "reset %d", reason);
}

static int gap_event(struct ble_gap_event *event, void *arg);
static int gatt_svc_cb(uint16_t conn_handle, const struct ble_gatt_error *error, const struct ble_gatt_svc *service, void *arg);
static int gatt_chr_cb(uint16_t conn_handle, const struct ble_gatt_error *error, const struct ble_gatt_chr *chr, void *arg);
static int gatt_dsc_cb(uint16_t conn_handle, const struct ble_gatt_error *error, uint16_t chr_val_handle, const struct ble_gatt_dsc *dsc, void *arg);
static int gatt_write_cb(uint16_t conn_handle, const struct ble_gatt_error *error, struct ble_gatt_attr *attr, void *arg);

static ble_addr_t g_target_addr;
static int g_target_addr_ok = 0;
static int g_last_rssi = 0;
static uint16_t g_notify_val_handle = 0;
static char g_peer_addr[18] = {0};
static uint16_t g_conn_handle = BLE_HS_CONN_HANDLE_NONE;
static uint16_t g_svc_start = 1;
static uint16_t g_svc_end = 0xffff;
static int g_have_svc_range = 0;

typedef enum {
  BTW_BLE_STATE_IDLE = 0,
  BTW_BLE_STATE_SCANNING,
  BTW_BLE_STATE_CONNECTING,
  BTW_BLE_STATE_CONNECTED,
  BTW_BLE_STATE_DISCOVERING,
  BTW_BLE_STATE_SUBSCRIBED,
} btw_ble_state_t;

static btw_ble_state_t g_state = BTW_BLE_STATE_IDLE;
static uint32_t g_reconnect_attempt = 0;
static esp_timer_handle_t g_scan_timer;
static esp_timer_handle_t g_notify_watchdog;
static uint32_t g_last_notify_ms = 0;

static uint32_t now_ms32(void) {
  return (uint32_t)(esp_timer_get_time() / 1000ULL);
}

static uint32_t backoff_ms(uint32_t attempt) {
  uint32_t v = 300U * (1U << (attempt > 6 ? 6 : attempt));
  if (v > 12000U) v = 12000U;
  return v;
}

static void start_scan_cb(void *arg) {
  (void)arg;
  start_scan();
}

static void schedule_scan(uint32_t delay_ms) {
  if (!g_scan_timer) {
    start_scan();
    return;
  }
  esp_timer_stop(g_scan_timer);
  ESP_ERROR_CHECK(esp_timer_start_once(g_scan_timer, (uint64_t)delay_ms * 1000ULL));
}

static void notify_watchdog_cb(void *arg) {
  (void)arg;
  if (g_state != BTW_BLE_STATE_SUBSCRIBED) return;
  uint32_t now = now_ms32();
  if (g_last_notify_ms && (now - g_last_notify_ms) < 30000U) return;
  if (g_conn_handle != BLE_HS_CONN_HANDLE_NONE) {
    ESP_LOGW(TAG, "no notify watchdog firing; terminating");
    ble_gap_terminate(g_conn_handle, BLE_ERR_REM_USER_CONN_TERM);
  }
}

static int parse_mac(const char *s, uint8_t out[6]) {
  if (!s || strlen(s) != 17) return -1;
  for (int i = 0; i < 6; i++) {
    int hi = isxdigit((unsigned char)s[i * 3]) ? s[i * 3] : 0;
    int lo = isxdigit((unsigned char)s[i * 3 + 1]) ? s[i * 3 + 1] : 0;
    if (!hi || !lo) return -1;
    int hv = (int)strtol((char[]){(char)hi, 0}, NULL, 16);
    int lv = (int)strtol((char[]){(char)lo, 0}, NULL, 16);
    out[i] = (uint8_t)((hv << 4) | lv);
    if (i < 5 && s[i * 3 + 2] != ':') return -1;
  }
  return 0;
}

static int parse_uuid128(const char *s, ble_uuid_any_t *out) {
  if (!s || !*s) return -1;
  uint8_t b[16];
  char hex[33] = {0};
  int j = 0;
  for (const char *p = s; *p && j < 32; p++) {
    if (*p == '-') continue;
    if (!isxdigit((unsigned char)*p)) return -1;
    hex[j++] = (char)tolower((unsigned char)*p);
  }
  if (j != 32) return -1;
  for (int i = 0; i < 16; i++) {
    char tmp[3] = {hex[i * 2], hex[i * 2 + 1], 0};
    b[i] = (uint8_t)strtol(tmp, NULL, 16);
  }
  ble_uuid_init_from_buf(&out->u, b, 16);
  return 0;
}

static void start_scan(void) {
  g_state = BTW_BLE_STATE_SCANNING;
 struct ble_gap_disc_params p = {0};
  p.itvl = 0x50;
  p.window = 0x30;
  p.filter_policy = 0;
  p.limited = 0;
  p.passive = 0;
  p.filter_duplicates = 1;
  int rc = ble_gap_disc(BLE_OWN_ADDR_PUBLIC, BLE_HS_FOREVER, &p, gap_event, NULL);
  if (rc != 0) {
    ESP_LOGE(TAG, "ble_gap_disc rc=%d", rc);
  }
}

static int gap_event(struct ble_gap_event *event, void *arg) {
  (void)arg;
  switch (event->type) {
    case BLE_GAP_EVENT_DISC: {
      struct ble_hs_adv_fields fields;
      int rc = ble_hs_adv_parse_fields(&fields, event->disc.data, event->disc.length_data);
      if (rc != 0) {
        return 0;
      }
      char addr[18];
      ble_addr_to_str(&event->disc.addr, addr);
      ESP_LOGI(TAG, "adv %s rssi %d", addr, event->disc.rssi);
      g_last_rssi = event->disc.rssi;
      if (g_target_addr_ok && memcmp(event->disc.addr.val, g_target_addr.val, 6) == 0) {
        ESP_LOGI(TAG, "target found, connecting %s", addr);
        g_state = BTW_BLE_STATE_CONNECTING;
        ble_gap_disc_cancel();
        struct ble_gap_conn_params cp = {0};
        cp.scan_itvl = 0x0010;
        cp.scan_window = 0x0010;
        cp.itvl_min = 0x0018;
        cp.itvl_max = 0x0028;
        cp.latency = 0;
        cp.supervision_timeout = 0x0100;
        int rc2 = ble_gap_connect(BLE_OWN_ADDR_PUBLIC, &event->disc.addr, 30000, &cp, gap_event, NULL);
        if (rc2 != 0) {
          ESP_LOGE(TAG, "connect rc=%d", rc2);
          g_reconnect_attempt++;
          schedule_scan(backoff_ms(g_reconnect_attempt));
        }
      }
      break;
    }
    case BLE_GAP_EVENT_CONNECT: {
      if (event->connect.status != 0) {
        ESP_LOGE(TAG, "connect failed status=%d", event->connect.status);
        g_reconnect_attempt++;
        schedule_scan(backoff_ms(g_reconnect_attempt));
        break;
      }
      ble_addr_to_str(&event->connect.peer_addr, g_peer_addr);
      g_state = BTW_BLE_STATE_CONNECTED;
      g_reconnect_attempt = 0;
      g_conn_handle = event->connect.conn_handle;
      g_have_svc_range = 0;
      g_svc_start = 1;
      g_svc_end = 0xffff;
      ESP_LOGI(TAG, "connected; conn_handle=%d", event->connect.conn_handle);
      g_notify_val_handle = 0;
      g_state = BTW_BLE_STATE_DISCOVERING;
      if (CONFIG_BTW_SERVICE_UUID[0]) {
        ble_uuid_any_t svc_uuid;
        if (parse_uuid128(CONFIG_BTW_SERVICE_UUID, &svc_uuid) != 0) {
          ESP_LOGE(TAG, "invalid CONFIG_BTW_SERVICE_UUID");
          ble_gap_terminate(event->connect.conn_handle, BLE_ERR_REM_USER_CONN_TERM);
          break;
        }
        int rc = ble_gattc_disc_svc_by_uuid(event->connect.conn_handle, &svc_uuid.u, gatt_svc_cb, NULL);
        if (rc != 0) {
          ESP_LOGE(TAG, "disc svc rc=%d", rc);
          ble_gap_terminate(event->connect.conn_handle, BLE_ERR_REM_USER_CONN_TERM);
        }
      } else {
        ble_uuid_any_t chr_uuid;
        if (parse_uuid128(CONFIG_BTW_CHAR_UUID, &chr_uuid) != 0) {
          ESP_LOGE(TAG, "invalid CONFIG_BTW_CHAR_UUID");
          ble_gap_terminate(event->connect.conn_handle, BLE_ERR_REM_USER_CONN_TERM);
          break;
        }
        int rc = ble_gattc_disc_chrs_by_uuid(
            event->connect.conn_handle, 1, 0xffff, &chr_uuid.u, gatt_chr_cb, NULL);
        if (rc != 0) {
          ESP_LOGE(TAG, "disc chrs rc=%d", rc);
          ble_gap_terminate(event->connect.conn_handle, BLE_ERR_REM_USER_CONN_TERM);
        }
      }
      break;
    }
    case BLE_GAP_EVENT_NOTIFY_RX: {
      uint16_t len = OS_MBUF_PKTLEN(event->notify_rx.om);
      if (len) {
        uint8_t *buf = (uint8_t *)malloc(len);
        if (buf) {
          int rc = os_mbuf_copydata(event->notify_rx.om, 0, len, buf);
          if (rc == 0) {
            g_last_notify_ms = now_ms32();
            btw_on_notify_owned(g_peer_addr[0] ? g_peer_addr : CONFIG_BTW_BLE_TARGET_ADDR, g_last_rssi, buf, len);
          } else {
            free(buf);
          }
        }
      }
      break;
    }
    case BLE_GAP_EVENT_DISCONNECT: {
      ESP_LOGW(TAG, "disconnect reason=%d", event->disconnect.reason);
      g_state = BTW_BLE_STATE_IDLE;
      g_conn_handle = BLE_HS_CONN_HANDLE_NONE;
      esp_timer_stop(g_notify_watchdog);
      g_reconnect_attempt++;
      schedule_scan(backoff_ms(g_reconnect_attempt));
      break;
    }
    default:
      break;
  }
  return 0;
}

static int gatt_svc_cb(uint16_t conn_handle, const struct ble_gatt_error *error, const struct ble_gatt_svc *service, void *arg) {
  (void)arg;
  if (error->status != 0) {
    ESP_LOGE(TAG, "svc discovery failed status=%d", error->status);
    ble_gap_terminate(conn_handle, BLE_ERR_REM_USER_CONN_TERM);
    return 0;
  }
  if (!service) {
    if (!g_have_svc_range) {
      ESP_LOGE(TAG, "service not found");
      ble_gap_terminate(conn_handle, BLE_ERR_REM_USER_CONN_TERM);
    }
    return 0;
  }
  g_svc_start = service->start_handle;
  g_svc_end = service->end_handle;
  g_have_svc_range = 1;

  ble_uuid_any_t chr_uuid;
  if (parse_uuid128(CONFIG_BTW_CHAR_UUID, &chr_uuid) != 0) {
    ESP_LOGE(TAG, "invalid CONFIG_BTW_CHAR_UUID");
    ble_gap_terminate(conn_handle, BLE_ERR_REM_USER_CONN_TERM);
    return 0;
  }
  int rc = ble_gattc_disc_chrs_by_uuid(conn_handle, g_svc_start, g_svc_end, &chr_uuid.u, gatt_chr_cb, NULL);
  if (rc != 0) {
    ESP_LOGE(TAG, "disc chrs rc=%d", rc);
    ble_gap_terminate(conn_handle, BLE_ERR_REM_USER_CONN_TERM);
  }
  return 0;
}

static int gatt_chr_cb(uint16_t conn_handle, const struct ble_gatt_error *error, const struct ble_gatt_chr *chr, void *arg) {
  (void)arg;
  if (error->status != 0) {
    if (g_notify_val_handle == 0) {
      ESP_LOGE(TAG, "chr discovery failed status=%d", error->status);
      ble_gap_terminate(conn_handle, BLE_ERR_REM_USER_CONN_TERM);
      return 0;
    }
    return 0;
  }
  if (chr && chr->val_handle) {
    g_notify_val_handle = chr->val_handle;
    int rc = ble_gattc_disc_all_dscs(conn_handle, chr->val_handle, chr->end_handle, gatt_dsc_cb, NULL);
    if (rc != 0) {
      ESP_LOGE(TAG, "disc dsc rc=%d", rc);
      ble_gap_terminate(conn_handle, BLE_ERR_REM_USER_CONN_TERM);
    }
  }
  return 0;
}

static int gatt_dsc_cb(uint16_t conn_handle, const struct ble_gatt_error *error, uint16_t chr_val_handle, const struct ble_gatt_dsc *dsc, void *arg) {
  (void)arg;
  (void)chr_val_handle;
  if (error->status != 0) {
    ESP_LOGE(TAG, "dsc discovery failed status=%d", error->status);
    ble_gap_terminate(conn_handle, BLE_ERR_REM_USER_CONN_TERM);
    return 0;
  }
  if (!dsc) return 0;
  if (ble_uuid_u16(&dsc->uuid.u) == 0x2902) {
    uint16_t cccd = 0x0001;
    int rc = ble_gattc_write_flat(conn_handle, dsc->handle, &cccd, sizeof(cccd), gatt_write_cb, NULL);
    if (rc != 0) {
      ESP_LOGE(TAG, "cccd write rc=%d", rc);
      ble_gap_terminate(conn_handle, BLE_ERR_REM_USER_CONN_TERM);
    } else {
      ESP_LOGI(TAG, "subscribe requested cccd_handle=%u", dsc->handle);
    }
    return 1;
  }
  return 0;
}

static int gatt_write_cb(uint16_t conn_handle, const struct ble_gatt_error *error, struct ble_gatt_attr *attr, void *arg) {
  (void)attr;
  (void)arg;
  if (error->status != 0) {
    ESP_LOGE(TAG, "write failed status=%d", error->status);
    ble_gap_terminate(conn_handle, BLE_ERR_REM_USER_CONN_TERM);
  } else {
    g_state = BTW_BLE_STATE_SUBSCRIBED;
    g_last_notify_ms = now_ms32();
    esp_timer_start_periodic(g_notify_watchdog, 5000000ULL);
    ESP_LOGI(TAG, "subscribe enabled");
  }
  return 0;
}

static void on_sync(void) {
  if (!g_scan_timer) {
    const esp_timer_create_args_t a = {
        .callback = start_scan_cb,
        .arg = NULL,
        .dispatch_method = ESP_TIMER_TASK,
        .name = "btw_scan",
    };
    ESP_ERROR_CHECK(esp_timer_create(&a, &g_scan_timer));
  }
  if (!g_notify_watchdog) {
    const esp_timer_create_args_t w = {
        .callback = notify_watchdog_cb,
        .arg = NULL,
        .dispatch_method = ESP_TIMER_TASK,
        .name = "btw_notify_wd",
    };
    ESP_ERROR_CHECK(esp_timer_create(&w, &g_notify_watchdog));
  }
  uint8_t mac[6] = {0};
  if (parse_mac(CONFIG_BTW_BLE_TARGET_ADDR, mac) == 0) {
    memcpy(g_target_addr.val, mac, 6);
    g_target_addr.type = BLE_ADDR_PUBLIC;
    g_target_addr_ok = 1;
  } else {
    ESP_LOGW(TAG, "invalid CONFIG_BTW_BLE_TARGET_ADDR; scanning without auto-connect");
  }
  schedule_scan(0);
}

static void host_task(void *param) {
  (void)param;
  nimble_port_run();
  nimble_port_freertos_deinit();
}

void btw_nimble_start(void) {
  ESP_ERROR_CHECK(esp_nimble_hci_and_controller_init());
  nimble_port_init();
  ble_hs_cfg.reset_cb = on_reset;
  ble_hs_cfg.sync_cb = on_sync;
  ble_svc_gap_init();
  nimble_port_freertos_init(host_task);
}
