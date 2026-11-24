import { chromium } from "playwright";

import "dotenv/config";

const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;

let browser;
browser = await chromium.launch({
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

const firstPage = await context.newPage();
const CGV_URL = "https://cgv.co.kr/cnm/movieBook/movie";
const params = new URLSearchParams({
  movNo: "30001790",
  scnYmd: "20261124",
  siteNo: "0013",
  siteNm: "용산아이파크몰",
  scnsNo: "018",
  scnSseq: "2"
});
const BASE_URL = `${CGV_URL}?${params}`;
await firstPage.goto(BASE_URL);