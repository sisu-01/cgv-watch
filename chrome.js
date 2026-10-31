import { chromium } from "playwright";
import { login } from "./login/login.js";

// isDev: 개발 할 때 미리 설정해놓은 쿠키 로그인 및 checking 무조건 걸림
const isDev = process.argv.includes("--dev") || process.env.IS_DEV === "true";
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;

// 브라우저 생성
const browser = await chromium.launch({
  headless: false,
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

// 로그인
let loginSuccess = true;
if (!isDev) {
  loginSuccess = await login(page);
}
if (loginSuccess) {
  await page.goto("https://cgv.co.kr"); 
}