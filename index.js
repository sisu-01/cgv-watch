import { chromium } from "playwright";
import { checking } from "./checking/checking.js";
import { booking } from "./booking/booking.js";
import { login } from "./login/login.js";
import logger from "./logger.js";

logger.info("시작!");

// 종료 이벤트 등록
process.on("SIGINT", async () => {
  await send_message("🔴 프로그램 종료 (Ctrl+C)");
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await send_message("🔴 프로그램 종료 (SIGTERM)");
  process.exit(0);
});

process.on("uncaughtException", async (err) => {
  await send_message(`❌ 치명적인 오류\n${err.stack}`);
  process.exit(1);
});

process.on("unhandledRejection", async (reason) => {
  await send_message(`❌ Promise 오류\n${reason}`);
  process.exit(1);
});

// 브라우저 생성
const browser = await chromium.launch({ headless: false });
const context = await browser.newContext({
  viewport: { width: 1280, height: 900 }
});

const isAutoLogin = false;
if (isAutoLogin) {
  await context.addCookies([
    {
      name: 'accessToken',
      value: process.env.ACCESS_TOKEN,
      domain: 'cgv.co.kr',
      path: '/',
    },
    {
      name: 'refresh_token',
      value: process.env.REFRESH_TOKEN,
      domain: '.cgv.co.kr',
      path: '/',
    }
  ]);
}

const page = await context.newPage();

// 로그인
let loginSuccess = true;
if (!isAutoLogin) {
  loginSuccess = await login(page);
}
if (loginSuccess) {
  const movieData = await checking();
  const success = await booking(page, movieData);
  if (success) {
    logger.info("🎉 예매 성공");
  } else {
    logger.warn("❌ 예매 실패");
  }
}
await browser.close();

// const b = await booking(a);
// console.log(b);