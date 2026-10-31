
import "dotenv/config";

import { checking } from "./checking/checking.js";
import { config as checkingConfig } from "./checking/config.js";
import { createSocketClient } from "./socket/client.js";
import logger from "./utils/logger.js";

const isDev = process.argv.includes("--dev");

const client = createSocketClient({
  role: "publisher",
  clientId: `opener-${process.pid}`,
});

function waitForAck(timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      clearTimeout(timer);
      client.emitter.off("publish-ack", onAck);
      client.emitter.off("client-error", onError);
    };
    
    const onAck = (message) => {
      cleanup();
      resolve(message);
    };
    
    const onError = (error) => {
      cleanup();
      reject(error);
    };
    
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error("OPEN_EVENT ACK timeout"));
    }, timeoutMs);
    
    client.emitter.once("publish-ack", onAck);
    client.emitter.once("client-error", onError);
  });
}

async function main() {
  logger.info("오픈 확인 클라이언트 시작");
  let keepAliveTimer = null;
  
  // 중앙 서버 연결 대기
  await client.waitUntilReady();
  
  logger.info("WebSocket 연결 완료");

  // 기존 CGV 오픈 확인 로직
  const movieData = await checking(
    checkingConfig,
    isDev
  );

  if (!movieData || typeof movieData !== "object") {
    throw new Error("유효한 movieData가 반환되지 않았습니다.");
  }

  logger.info("CGV 오픈 감지");

  // JSON 직렬화 가능한 데이터인지 확인
  const payload = JSON.parse(JSON.stringify(movieData));

  // ACK 리스너를 먼저 등록
  const ackPromise = waitForAck();

  // 중앙 서버로 결과 전달
  client.publishOpenEvent(payload);

  const ack = await ackPromise;

  logger.info(
    `오픈 이벤트 전달 완료: ${ack.deliveredCount}개 클라이언트`
  );

  if (ack.deliveredCount === 0) {
    logger.warn("연결된 subscriber가 없습니다.");
  }

  client.close();

  logger.info("오픈 이벤트 처리 완료. 종료 명령까지 대기합니다.");
  // Node.js 프로세스가 종료되지 않도록 유지
  keepAliveTimer = setInterval(() => {}, 60_000);
}

process.on("SIGINT", () => {
  client.close();
  process.exit(130);
});

main().catch((error) => {
  logger.error(`OPENER ERROR: ${error.stack || error}`);
  client.close();
  process.exitCode = 1;
});
