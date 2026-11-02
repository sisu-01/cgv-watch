
import "dotenv/config";

import { WebSocketServer, WebSocket } from "ws";
import { randomUUID } from "node:crypto";

const HOST = process.env.WS_HOST || "127.0.0.1";
const PORT = Number(process.env.WS_PORT || 8787);
const TOKEN = process.env.WS_TOKEN;

if (!TOKEN) {
  throw new Error("WS_TOKEN 환경변수가 필요합니다.");
}

const wss = new WebSocketServer({
  host: HOST,
  port: PORT,
  maxPayload: 16 * 1024,
});

function sendJson(socket, data) {
  if (socket.readyState !== WebSocket.OPEN) return;

  socket.send(JSON.stringify(data));
}

function getClients() {
  return [...wss.clients]
    .filter((socket) => socket.isAuthenticated);
}

function getClientCounts() {
  const clients = getClients();

  return {
    publisher: clients.filter((c) => c.role === "publisher").length,
    subscriber: clients.filter((c) => c.role === "subscriber").length,
  };
}

function closeWithError(socket, message) {
  sendJson(socket, {
    type: "ERROR",
    message,
  });

  socket.close(1008, "Invalid request");
}

wss.on("connection", (socket, request) => {
  socket.isAlive = true;
  socket.isAuthenticated = false;
  socket.role = null;
  socket.clientId = null;

  const remoteAddress = request.socket.remoteAddress;

  console.log(`[CONNECT] ${remoteAddress}`);

  const authTimer = setTimeout(() => {
    if (!socket.isAuthenticated) {
      socket.close(1008, "Authentication timeout");
    }
  }, 5000);

  socket.on("pong", () => {
    socket.isAlive = true;
  });

  socket.on("message", (raw) => {
    let message;

    try {
      message = JSON.parse(raw.toString());
    } catch {
      closeWithError(socket, "Invalid JSON");
      return;
    }

    // 1. 최초 인증
    if (!socket.isAuthenticated) {
      if (message.type !== "AUTH") {
        closeWithError(socket, "Authentication required");
        return;
      }

      const { token, role, clientId } = message;

      if (token !== TOKEN) {
        closeWithError(socket, "Invalid token");
        return;
      }

      if (!["publisher", "subscriber"].includes(role)) {
        closeWithError(socket, "Invalid role");
        return;
      }

      if (
        typeof clientId !== "string" ||
        !/^[a-zA-Z0-9_.:-]{1,80}$/.test(clientId)
      ) {
        closeWithError(socket, "Invalid clientId");
        return;
      }

      socket.isAuthenticated = true;
      socket.role = role;
      socket.clientId = clientId;

      clearTimeout(authTimer);

      console.log(
        `[AUTH] ${role} / ${clientId}`,
        getClientCounts()
      );

      sendJson(socket, {
        type: "AUTH_OK",
        clientId,
        role,
        counts: getClientCounts(),
      });

      return;
    }

    // 2. 테스트 이벤트 발행
    if (message.type === "PUBLISH_OPEN_EVENT") {
      if (socket.role !== "publisher") {
        closeWithError(socket, "Publisher only");
        return;
      }

      const data = message.data;

      if (
        data === null ||
        typeof data !== "object" ||
        Array.isArray(data)
      ) {
        closeWithError(socket, "Invalid event data");
        return;
      }

      const event = {
        type: "OPEN_DETECTED",
        eventId: randomUUID(),
        publisherId: socket.clientId,
        timestamp: Date.now(),
        data,
      };

      let deliveredCount = 0;

      // 3. 모든 subscriber에게 전달
      for (const client of wss.clients) {
        if (
          client.isAuthenticated &&
          client.role === "subscriber" &&
          client.readyState === WebSocket.OPEN
        ) {
          sendJson(client, event);
          deliveredCount++;
        }
      }

      console.log(
        `[OPEN DETECTED] ${event.eventId} / delivered: ${deliveredCount}`
      );

      // 4. 발행자에게 전달 결과 회신
      sendJson(socket, {
        type: "PUBLISH_ACK",
        eventId: event.eventId,
        deliveredCount,
      });

      return;
    }

    closeWithError(socket, `Unknown message type: ${message.type}`);
  });

  socket.on("close", (code) => {
    clearTimeout(authTimer);

    console.log(
      `[DISCONNECT] ${socket.clientId || remoteAddress} / code: ${code}`,
      getClientCounts()
    );
  });

  socket.on("error", (error) => {
    console.error(`[SOCKET ERROR] ${error.message}`);
  });
});

// 연결 상태 확인용 Heartbeat
const heartbeatTimer = setInterval(() => {
  for (const socket of wss.clients) {
    if (socket.isAlive === false) {
      socket.terminate();
      continue;
    }

    socket.isAlive = false;
    socket.ping();
  }
}, 30000);

wss.on("listening", () => {
  console.log(`WebSocket Server: ws://${HOST}:${PORT}`);
});

function shutdown() {
  console.log("\n[SERVER] Shutdown");

  clearInterval(heartbeatTimer);

  for (const socket of wss.clients) {
    socket.close(1001, "Server shutdown");
  }

  wss.close(() => {
    process.exit(0);
  });

  setTimeout(() => {
    process.exit(1);
  }, 5000).unref();
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
