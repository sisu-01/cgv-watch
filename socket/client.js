
import "dotenv/config";

import WebSocket from "ws";
import { EventEmitter } from "node:events";

const WS_URL = process.env.WS_URL || "ws://127.0.0.1:8787";
const WS_TOKEN = process.env.WS_TOKEN;

if (!WS_TOKEN) {
  throw new Error("WS_TOKEN 환경변수가 필요합니다.");
}

export function createSocketClient({
  role,
  clientId,
}) {
  if (!["publisher", "subscriber"].includes(role)) {
    throw new Error("Invalid role");
  }

  const emitter = new EventEmitter();

  let ws = null;
  let authenticated = false;
  let stopped = false;
  let reconnectTimer = null;
  let retryDelay = 1000;
  let authFailed = false;

  const readyWaiters = [];

  function connect() {
    if (stopped) return;

    console.log(`[SOCKET] Connecting: ${clientId}`);

    ws = new WebSocket(WS_URL);

    ws.on("open", () => {
      console.log(`[SOCKET] Connected: ${clientId}`);

      ws.send(JSON.stringify({
        type: "AUTH",
        role,
        clientId,
        token: WS_TOKEN,
      }));
    });

    ws.on("message", (raw) => {
      let message;

      try {
        message = JSON.parse(raw.toString());
      } catch {
        console.error("[SOCKET] Invalid server message");
        return;
      }

      switch (message.type) {
        case "AUTH_OK": {
          authenticated = true;
          retryDelay = 1000;

          console.log(`[SOCKET] Authenticated: ${clientId}`);

          while (readyWaiters.length > 0) {
            readyWaiters.shift().resolve();
          }

          emitter.emit("ready", message);
          break;
        }

        case "ERROR": {
          console.error(`[SOCKET] Server error: ${message.message}`);

          if (!authenticated) {
            authFailed = true;
            stopped = true;

            const error = new Error(message.message);

            while (readyWaiters.length > 0) {
              readyWaiters.shift().reject(error);
            }

            emitter.emit("client-error", error);
            ws.close();
          }

          break;
        }

        case "OPEN_DETECTED": {
          if (role === "subscriber") {
            emitter.emit("open-detected", message);
          }

          break;
        }

        case "PUBLISH_ACK": {
          emitter.emit("publish-ack", message);
          break;
        }

        default: {
          console.log("[SOCKET] Unknown message:", message.type);
        }
      }
    });

    ws.on("close", (code) => {
      authenticated = false;

      console.log(
        `[SOCKET] Disconnected: ${clientId} / ${code}`
      );

      emitter.emit("disconnected", code);

      scheduleReconnect();
    });

    ws.on("error", (error) => {
      emitter.emit("client-error", error);
      console.error(`[SOCKET ERROR] ${error.message}`);
    });
  }

  function scheduleReconnect() {
    if (stopped || authFailed) return;

    if (reconnectTimer) return;

    const delay = retryDelay;

    console.log(`[SOCKET] Reconnect in ${delay}ms`);

    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      connect();
    }, delay);

    retryDelay = Math.min(retryDelay * 2, 15000);
  }

  function waitUntilReady() {
    if (authenticated) {
      return Promise.resolve();
    }

    if (stopped) {
      return Promise.reject(
        new Error("Socket client has stopped")
      );
    }

    return new Promise((resolve, reject) => {
      readyWaiters.push({ resolve, reject });
    });
  }

  function publishOpenEvent(data) {
    if (role !== "publisher") {
      throw new Error("Publisher only");
    }

    if (!authenticated || ws?.readyState !== WebSocket.OPEN) {
      throw new Error("WebSocket is not ready");
    }

    ws.send(JSON.stringify({
      type: "PUBLISH_OPEN_EVENT",
      data,
    }));
  }

  function close() {
    stopped = true;
    authenticated = false;

    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }

    if (ws) {
      ws.close(1000, "Client shutdown");
    }

    while (readyWaiters.length > 0) {
      readyWaiters.shift().reject(
        new Error("Socket client closed")
      );
    }
  }

  connect();

  return {
    emitter,
    waitUntilReady,
    publishOpenEvent,
    close,

    get isReady() {
      return authenticated;
    },
  };
}
