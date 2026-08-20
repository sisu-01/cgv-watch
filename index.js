import { chromium } from "playwright";
import { login } from "./login/login.js";
import { checking } from "./checking/checking.js";
import { booking } from "./booking/booking.js";
import { payment } from "./payment/payment.js";
import logger from "./utils/logger.js";
import { update_history } from "./utils/utils.js";
import { performance } from "node:perf_hooks";
import { send_message } from "./telegram/telegram.js";

// 로그인 성공 -> 소용돌이 출력까지 너무 느려, loop1 다음까지 느려

logger.info("시작!");

// 종료 이벤트 등록
// process.on("SIGINT", async () => {
//   await send_message("🔴 프로그램 종료 (Ctrl+C)");
//   process.exit(0);
// });

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

// isDev: 개발 할 때 미리 설정해놓은 쿠키 로그인 및 checking 무조건 걸림
const isDev = process.argv.includes("--dev") || process.env.IS_DEV === "true";
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;
const MOVIE_TITLE = process.env.MOVIE_TITLE;
const SCREEN_YMD = process.env.SCREEN_YMD;

// 브라우저 생성
const browser = await chromium.launch({
  headless: true,
  args: [
    "--disable-gpu",
    "--disable-dev-shm-usage",
    "--disable-software-rasterizer",
    "--disable-extensions",
    "--disable-plugins",
    "--disable-popup-blocking",
    "--disable-renderer-backgrounding",
    "--disable-background-networking",
    "--mute-audio",
    "--no-first-run",
  ]
});

const context = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  locale: "ko-KR",
  timezoneId: "Asia/Seoul",
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36",
  extraHTTPHeaders: {
    "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
    "Upgrade-Insecure-Requests": "1",
    "DNT": "1",
  },
});

// --dev 면 미리 설정한 쿠키로 로그인
if (isDev) {
  await context.addCookies([
    {
      name: 'accessToken',
      value: ACCESS_TOKEN,
      domain: 'cgv.co.kr',
      path: '/',
    },
    {
      name: 'refresh_token',
      value: REFRESH_TOKEN,
      domain: '.cgv.co.kr',
      path: '/',
    }
  ]);
}

const page = await context.newPage();

// 타임아웃 방지
page.setDefaultTimeout(150000);
page.setDefaultNavigationTimeout(150000);

// 테스트용 모든 네트워크 느릐게
// await page.route('**/*', async route => {
//   const delay = 2000 + Math.random() * 5000;
//   await new Promise(resolve => setTimeout(resolve, delay));
//   await route.continue();
// });

// 로그인
let loginSuccess = true;
if (!isDev) {
  loginSuccess = await login(page);
}

if (loginSuccess) {
  // origin cgv로 하면서 로딩 빠르게
  await page.goto("https://cgv.co.kr/robots.txt");
  
  // 영화 오픈 체크
  const movieData = await checking(isDev);

  // 좌석 선택
  const isSuccess = await booking(page, movieData);
  if (isSuccess) {
    // 결제 천천히 해도 되니까 999
    page.setDefaultTimeout(999999999);
    page.setDefaultNavigationTimeout(999999999);
    
    // 결제
    const { isComplete, paymentCode } = await payment(page);
    
    // 오픈 언제 열렸는지 기록
    update_history(MOVIE_TITLE, SCREEN_YMD)

    if (isComplete && paymentCode === null) {
      logger.info(`🎉 예매 성공 영화 관람권`);
      await send_message(`🎉 ${MOVIE_TITLE} ${SCREEN_YMD} 예매 성공 및 결제완료\n영화 관람권 써서 다 끝냈다~ 🎟️`);
    }
    if (!isComplete && paymentCode !== null) {
      logger.info(`🎉 예매 성공 ${paymentCode}`);

      // 결제창 10분 동안 브라우저 유지 및 결제 코드 계속 전송
      const interval = setInterval(async () => {
        await send_message(`🎉 ${MOVIE_TITLE} ${SCREEN_YMD} 예매 성공\n결제 코드: ${paymentCode}`);
      }, 10 * 1000);
      await new Promise(resolve => setTimeout(resolve, 10 * 60 * 1000));
      
      clearInterval(interval);
    }
    if (!isComplete && paymentCode === null) {
      await send_message("😭 index 결제 실패했어요 ㅠㅠㅠ");
      logger.info("index 결제 실패");
    }
  } else {
    await send_message("😭 booking 좌석 선택 실패했어요 ㅠㅠㅠ");
    logger.info("booking 좌석 선택 실패");
  }
}
// await browser.close();