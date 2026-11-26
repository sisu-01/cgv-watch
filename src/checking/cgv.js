import axios from "axios";
import { Agent, setGlobalDispatcher } from "undici";
import logger from "../utils/logger.js";
import { send_message } from "../telegram/telegram.js";

setGlobalDispatcher(
  new Agent({
    connect: {
      ciphers: "DEFAULT"
    }
  })
);

// 연속된 API 오류에 대한 중복 알림 방지
let errorNotified = false;
let errorStartedAt = null;

const ERROR_REMINDER_INTERVAL = 5 * 60 * 1000; // 5분

export async function fetchCgvSchedule(url) {
  const startedAt = Date.now();

  try {
    const res = await axios.get(url, {
      headers: {
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/150 Safari/537.36",
        "referer": "https://cgv.co.kr/"
      }
    });

    // API 호출 정상화
    errorNotified = false;
    errorStartedAt = null;

    return res.data;

  } catch (error) {
    const response = error.response;

    logger.error(
      JSON.stringify({
        message: error.message,
        status: response?.status,
        statusText: response?.statusText,
        url: error.config?.url,
        method: error.config?.method,
        responseHeaders: response?.headers,
        responseData:
          typeof response?.data === "string"
            ? response.data.slice(0, 3000)
            : response?.data,
        requestHeaders: error.config?.headers,
        elapsedMs: Date.now() - startedAt
      })
    );
    
    const now = Date.now();

    // 최초 오류 발생 시 텔레그램 알림
    if (!errorNotified) {
      errorNotified = true;
      errorStartedAt = now;
      await sendErrorNotification(error, response);
    } else if ( now - errorStartedAt >= ERROR_REMINDER_INTERVAL ) {
      await sendErrorNotification(error, response);
    }
    return null;
  }
}

async function sendErrorNotification(error, response) {
  try {
    await send_message(
      `🚨 CGV API 호출 오류 발생!\n\n` +
      `HTTP 상태: ${response?.status ?? "응답 없음"}\n` +
      `오류 내용: ${error.message}\n` +
      `최초 발생: ${new Date(errorStartedAt).toLocaleString("ko-KR", {
        timeZone: "Asia/Seoul"
      })}\n` +
      `알림 시각: ${new Date().toLocaleString("ko-KR", {
        timeZone: "Asia/Seoul"
      })}`
    );
  } catch (telegramError) {
    logger.error("CGV API 오류 텔레그램 전송 실패");
    logger.error(telegramError);
  }
}