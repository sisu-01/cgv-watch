// subscriber.js
import "dotenv/config";

import { chromium } from "playwright";
import { login } from "./login/login.js";
import { getBookingConfig } from "./booking/config.js";
import { booking } from "./booking/booking.js";
import { payment } from "./payment/payment.js";
import logger from "./utils/logger.js";
import { send_message_and_save_log } from "./utils/utils.js";
import { send_message } from "./telegram/telegram.js";
import { createSocketClient } from "./socket/client.js";

// isDev: 개발 할 때 미리 설정해놓은 쿠키 로그인 및 checking 무조건 걸림
const VERSION = process.env.VERSION;
const isDev = process.argv.includes("--dev") || process.env.IS_DEV === "true";
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;
const MOVIE_TITLE = process.env.MOVIE_TITLE;
const SCREEN_YMD = process.env.SCREEN_YMD;
const TABS_NUMBER = Number(process.env.TABS_NUMBER);
const CLIENT_TOTAL = Number(process.env.CLIENT_TOTAL);
const CLIENT_NUMBER = Number(process.argv[2])-1 || Number(process.env.CLIENT_NUMBER)-1;
const ID = JSON.parse(process.env.ID)[CLIENT_NUMBER];
const PW = JSON.parse(process.env.PW)[CLIENT_NUMBER];

let browser;
let pages = [];
let bookingConfigs = [];

async function main() {
  // 브라우저 생성
  browser = await chromium.launch({
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

  // 로그인 해야되니까 일단 하나 띄워놔
  const firstPage = await context.newPage();
  // 타임아웃 방지
  firstPage.setDefaultTimeout(150000);
  firstPage.setDefaultNavigationTimeout(150000);

  // 로그인
  let loginSuccess = true;
  if (!isDev) {
    loginSuccess = await login(firstPage, ID, PW);
  }

  // 로그인 안 됐으면 절루 가라~
  if (!loginSuccess) {
    await send_message_and_save_log("로그인 실패");
    return;
  }

  // origin cgv로 하면서 로딩 빠르게
  const readyUrl = "https://cgv.co.kr/robots.txt";
  await firstPage.goto(readyUrl);

    // 1. 탭 n개 미리 생성 및 페이지 이동
  pages = [firstPage]; // 첫 번째 탭 포함
  for (let i=1; i < TABS_NUMBER; i++) {
    const page = await context.newPage(); // 로그인 쿠키가 공유된 새 탭 열기
    await page.goto(readyUrl);           // 작업 페이지로 이동
    page.setDefaultTimeout(150000);
    page.setDefaultNavigationTimeout(150000);
    pages.push(page);
  }
  for (let i=0; i<TABS_NUMBER; i++) {
    bookingConfigs.push(
      getBookingConfig(i, CLIENT_TOTAL, CLIENT_NUMBER)
    );
  }

  // WebSocket 연결
  const client = createSocketClient({
    role: "subscriber",
    clientId: `subscriber-${process.pid}`,
  });

  client.emitter.on("ready", () => {
    logger.info("오픈 이벤트 수신 준비 완료");
  });

  client.emitter.on("open-detected", async (event) => {
    // logger.info("========== CGV OPEN DETECTED ==========");
  
    // logger.info(`Event ID: ${event.eventId}`);
    // logger.info(`Publisher: ${event.publisherId}`);
    // logger.info(`Timestamp: ${new Date(event.timestamp).toISOString()}`);
  
    // 실제 CGV 오픈 감지 결과
    const movieData = event.data;
    logger.info("오픈 확인");
    await Promise.all(
      pages.map(async (page, tabIndex) => {
        const tabName = `탭 ${tabIndex + 1}`;
        // 좌석 선택
        const { isSuccess, selectedSeats } = await booking(page, bookingConfigs[tabIndex], movieData, tabIndex);
        if (!isSuccess) {
          await send_message_and_save_log(`${ID}\n${tabName} 좌석 선택 실패`);
          await page.close();
          return;
        }
        
        // 결제 천천히 해도 되니까 999
        page.setDefaultTimeout(999999999);
        page.setDefaultNavigationTimeout(999999999);
        
        // 결제
        const { isTicketSuccess, paymentCode } = await payment(page);
        
        // 1. 영화 관람권 사용
        // 2. 앱카드 결제
        // 3. 실패
        
        // 1. 영화 관람권 사용
        if (isTicketSuccess && paymentCode === null) {
          await send_message_and_save_log(`${ID}\n${tabName} ${MOVIE_TITLE} ${SCREEN_YMD} ${selectedSeats} 관람권 사용 성공`);
        }
        
        // 2. 앱카드 결제
        if (!isTicketSuccess && paymentCode !== null) {
          logger.info(`${tabName} 🎉 예매 성공 ${paymentCode}`);
        
          // 결제창 10분 동안 브라우저 유지 및 결제 코드 계속 전송
          const interval = setInterval(async () => {
            const seatMapUrl = `https://sisu-01.github.io/cgv-watch/#${selectedSeats}`;
            await send_message(`${ID}\n${tabName} ${selectedSeats}\n 🎉 ${MOVIE_TITLE} ${SCREEN_YMD} 예매 성공\n${seatMapUrl}\n결제 코드: ${paymentCode}`, paymentCode.replace(/-/g, ''));
          }, 10 * 1000);
          await new Promise(resolve => setTimeout(resolve, 10 * 60 * 1000));
          
          clearInterval(interval);
        }
        
        // 3. 실패
        if (!isTicketSuccess && paymentCode === null) {
          await send_message_and_save_log(`${tabName} 결제 실패`);
        }
        // 오픈 언제 열렸는지 기록
        // update_history(MOVIE_TITLE, OPEN_YMD);
        // await browser.close();
      })
    );
  
    // logger.info("========================================");
  });

  client.emitter.on("disconnected", (code) => {
    logger.warn(`WebSocket 연결 종료: ${code}`);
  });

  client.emitter.on("client-error", (error) => {
    logger.error(`WebSocket 오류: ${error.message}`);
  });
  
  process.on("SIGINT", () => {
    client.close();
    process.exit(0);
  });
  
  send_message_and_save_log(`${VERSION} ${ID}\nSubscriber 실행 중`);
  await client.waitUntilReady();
}

await main();