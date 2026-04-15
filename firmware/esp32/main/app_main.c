#include <stdlib.h>
#include <string.h>
#include <sys/time.h>

#include "btw_nimble_cent.h"
#include "cJSON.h"
#include "esp_event.h"
#include "esp_http_client.h"
#include "esp_log.h"
#include "esp_timer.h"
#include "esp_netif.h"
#include "esp_wifi.h"
#include "esp_err.h"
#include "freertos/FreeRTOS.h"
#include "freertos/event_groups.h"
#include "freertos/queue.h"
#include "freertos/task.h"
#include "nvs_flash.h"
#include "sdkconfig.h"

static const char *TAG = "btw_main";

typedef struct {
  char addr[18];
  int rssi;
  uint16_t len;
  uint8_t *data;
} btw_notify_msg_t;

static QueueHandle_t g_notify_q = NULL;
static EventGroupHandle_t g_wifi_events = NULL;
static const EventBits_t WIFI_READY_BIT = BIT0;
static esp_timer_handle_t g_wifi_reconnect_timer;
static uint32_t g_wifi_reconnect_attempt;

typedef struct {
  uint32_t wifi_disconnects;
  uint32_t wifi_reconnects;
  uint32_t wifi_auth_fail;
  uint32_t notify_enqueued;
  uint32_t notify_dropped;
  uint32_t http_post_ok;
  uint32_t http_post_fail;
} btw_stats_t;

static btw_stats_t g_stats;

static int64_t now_ms(void) {
  struct timeval tv;
  gettimeofday(&tv, NULL);
  return (int64_t)tv.tv_sec * 1000LL + tv.tv_usec / 1000;
}

static void on_wifi_event(void *arg, esp_event_base_t base, int32_t id, void *data) {
  (void)arg;
  if (base == WIFI_EVENT && id == WIFI_EVENT_STA_DISCONNECTED) {
    g_stats.wifi_disconnects++;
    xEventGroupClearBits(g_wifi_events, WIFI_READY_BIT);
    wifi_event_sta_disconnected_t *ev = (wifi_event_sta_disconnected_t *)data;
    if (ev && (ev->reason == WIFI_REASON_AUTH_FAIL || ev->reason == WIFI_REASON_4WAY_HANDSHAKE_TIMEOUT)) {
      g_stats.wifi_auth_fail++;
      g_wifi_reconnect_attempt = 0;
      esp_timer_stop(g_wifi_reconnect_timer);
      return;
    }
    g_wifi_reconnect_attempt++;
    uint32_t delay_ms = 250U * (1U << (g_wifi_reconnect_attempt > 6 ? 6 : g_wifi_reconnect_attempt));
    if (delay_ms > 30000U) delay_ms = 30000U;
    esp_timer_stop(g_wifi_reconnect_timer);
    esp_timer_start_once(g_wifi_reconnect_timer, (uint64_t)delay_ms * 1000ULL);
    return;
  }
  if (base == IP_EVENT && id == IP_EVENT_STA_GOT_IP) {
    g_wifi_reconnect_attempt = 0;
    xEventGroupSetBits(g_wifi_events, WIFI_READY_BIT);
    return;
  }
}

static void wifi_reconnect_cb(void *arg) {
  (void)arg;
  esp_wifi_connect();
  g_stats.wifi_reconnects++;
}

static void wifi_init_sta(void) {
  ESP_ERROR_CHECK(esp_netif_init());
  ESP_ERROR_CHECK(esp_event_loop_create_default());
  esp_netif_create_default_wifi_sta();
  wifi_init_config_t cfg = WIFI_INIT_CONFIG_DEFAULT();
  ESP_ERROR_CHECK(esp_wifi_init(&cfg));
  ESP_ERROR_CHECK(esp_wifi_set_mode(WIFI_MODE_STA));
  wifi_config_t wifi_config = {0};
  strncpy((char *)wifi_config.sta.ssid, CONFIG_BTW_WIFI_SSID, sizeof(wifi_config.sta.ssid) - 1);
  strncpy((char *)wifi_config.sta.password, CONFIG_BTW_WIFI_PASSWORD, sizeof(wifi_config.sta.password) - 1);
  ESP_ERROR_CHECK(esp_wifi_set_config(WIFI_IF_STA, &wifi_config));
  if (!g_wifi_reconnect_timer) {
    const esp_timer_create_args_t t = {
        .callback = wifi_reconnect_cb,
        .arg = NULL,
        .dispatch_method = ESP_TIMER_TASK,
        .name = "btw_wifi_reconn",
    };
    ESP_ERROR_CHECK(esp_timer_create(&t, &g_wifi_reconnect_timer));
  }
  ESP_ERROR_CHECK(esp_event_handler_register(WIFI_EVENT, ESP_EVENT_ANY_ID, on_wifi_event, NULL));
  ESP_ERROR_CHECK(esp_event_handler_register(IP_EVENT, IP_EVENT_STA_GOT_IP, on_wifi_event, NULL));
  ESP_ERROR_CHECK(esp_wifi_start());
  ESP_ERROR_CHECK(esp_wifi_connect());
  ESP_LOGI(TAG, "wifi start");
}

static esp_err_t post_envelope(const char *url, const char *json) {
  esp_http_client_config_t cfg = {
 .url = url,
      .method = HTTP_METHOD_POST,
      .timeout_ms = 8000,
  };
  esp_http_client_handle_t c = esp_http_client_init(&cfg);
  esp_http_client_set_header(c, "Content-Type", "application/json");
  esp_http_client_set_post_field(c, json, strlen(json));
  esp_err_t err = esp_http_client_perform(c);
  int code = esp_http_client_get_status_code(c);
  esp_http_client_cleanup(c);
  if (err == ESP_OK && code >= 200 && code < 300) {
    return ESP_OK;
  }
  ESP_LOGE(TAG, "http err=%s code=%d", esp_err_to_name(err), code);
  return ESP_FAIL;
}

static char *build_envelope(const char *addr, int rssi, const uint8_t *data_bytes, uint16_t len) {
  cJSON *root = cJSON_CreateObject();
  cJSON *src = cJSON_CreateObject();
  cJSON *dev = cJSON_CreateObject();
  cJSON *pay = cJSON_CreateObject();
  cJSON *data = cJSON_CreateObject();
  cJSON_AddNumberToObject(root, "schema_version", 1);
  cJSON_AddItemToObject(root, "source", src);
  cJSON_AddStringToObject(src, "runtime", "esp32");
  cJSON_AddStringToObject(src, "bridge_id", CONFIG_BTW_BRIDGE_ID);
  cJSON_AddNullToObject(src, "adapter");
  cJSON_AddItemToObject(root, "device", dev);
  cJSON_AddStringToObject(dev, "address", addr ? addr : CONFIG_BTW_BLE_TARGET_ADDR);
  cJSON_AddNullToObject(dev, "name");
  cJSON_AddNullToObject(dev, "manufacturer_data_hex");
  cJSON_AddItemToObject(dev, "service_uuids", cJSON_CreateArray());
  cJSON_AddItemToObject(root, "payload", pay);
  cJSON_AddStringToObject(pay, "kind", "raw_bytes");
  cJSON_AddItemToObject(pay, "data", data);
  char *hex = (char *)malloc((size_t)len * 2 + 1);
  if (hex) {
    static const char *H = "0123456789abcdef";
    for (uint16_t i = 0; i < len; i++) {
      hex[i * 2] = H[(data_bytes[i] >> 4) & 0xF];
      hex[i * 2 + 1] = H[data_bytes[i] & 0xF];
    }
    hex[len * 2] = 0;
    cJSON_AddStringToObject(data, "hex", hex);
    free(hex);
  } else {
    cJSON_AddStringToObject(data, "hex", "");
  }
  cJSON_AddNumberToObject(data, "length", (double)len);
  cJSON_AddStringToObject(pay, "characteristic_uuid", CONFIG_BTW_CHAR_UUID);
  cJSON_AddNumberToObject(root, "timestamp_ms", (double)now_ms());
  cJSON_AddNumberToObject(root, "rssi", (double)rssi);
  char *out = cJSON_PrintUnformatted(root);
  cJSON_Delete(root);
  return out;
}

void btw_on_notify_owned(const char *addr, int rssi, uint8_t *data, uint16_t len) {
  if (!g_notify_q || !data || len == 0) {
    free(data);
    return;
  }
  btw_notify_msg_t msg = {0};
  strncpy(msg.addr, addr ? addr : CONFIG_BTW_BLE_TARGET_ADDR, sizeof(msg.addr) - 1);
  msg.rssi = rssi;
  msg.len = len;
  msg.data = data;

  if (xQueueSend(g_notify_q, &msg, 0) == pdTRUE) {
    g_stats.notify_enqueued++;
    return;
  }

  // drop-oldest then retry once
  btw_notify_msg_t old = {0};
  if (xQueueReceive(g_notify_q, &old, 0) == pdTRUE) {
    free(old.data);
    g_stats.notify_dropped++;
  }
  if (xQueueSend(g_notify_q, &msg, 0) == pdTRUE) {
    g_stats.notify_enqueued++;
    return;
  }
  g_stats.notify_dropped++;
  free(msg.data);
}

static void http_worker(void *arg) {
  (void)arg;
  for (;;) {
    xEventGroupWaitBits(g_wifi_events, WIFI_READY_BIT, pdFALSE, pdTRUE, portMAX_DELAY);
    btw_notify_msg_t msg = {0};
    if (xQueueReceive(g_notify_q, &msg, portMAX_DELAY) != pdTRUE) continue;
    char *json = build_envelope(msg.addr, msg.rssi, msg.data, msg.len);
    if (json) {
      esp_err_t last = ESP_FAIL;
      for (int attempt = 0; attempt < 3; attempt++) {
        if ((xEventGroupGetBits(g_wifi_events) & WIFI_READY_BIT) == 0) break;
        last = post_envelope(CONFIG_BTW_HTTP_URL, json);
        if (last == ESP_OK) break;
        vTaskDelay(pdMS_TO_TICKS(150 * (attempt + 1)));
      }
      if (last == ESP_OK) g_stats.http_post_ok++;
      else g_stats.http_post_fail++;
      free(json);
    }
    free(msg.data);
  }
}

static void stats_worker(void *arg) {
  (void)arg;
  for (;;) {
    vTaskDelay(pdMS_TO_TICKS(15000));
    UBaseType_t depth = g_notify_q ? uxQueueMessagesWaiting(g_notify_q) : 0;
    ESP_LOGI(
        TAG,
        "stats wifi{disc=%u reconn=%u} q{depth=%u enq=%u drop=%u} http{ok=%u fail=%u}",
        (unsigned)g_stats.wifi_disconnects,
        (unsigned)g_stats.wifi_reconnects,
        (unsigned)depth,
        (unsigned)g_stats.notify_enqueued,
        (unsigned)g_stats.notify_dropped,
        (unsigned)g_stats.http_post_ok,
        (unsigned)g_stats.http_post_fail);
  }
}

void app_main(void) {
  ESP_ERROR_CHECK(nvs_flash_init());
  g_wifi_events = xEventGroupCreate();
  wifi_init_sta();
  g_notify_q = xQueueCreate(16, sizeof(btw_notify_msg_t));
  xTaskCreate(http_worker, "btw_http", 4096, NULL, 5, NULL);
  xTaskCreate(stats_worker, "btw_stats", 3072, NULL, 1, NULL);
  btw_nimble_start();
  while (1) vTaskDelay(pdMS_TO_TICKS(60000));
}
