import { chromium } from "playwright";
import { checking } from "./checking/checking.js";
import { booking } from "./booking/booking.js";
import { login } from "./login/login.js";

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
if (!isAutoLogin) {
  await login(page);
}
const movieData = await checking();
const success = await booking(page, movieData);
if (success) {
  console.log("샤샷");
} else {
  console.log("에라이");
}

// const b = await booking(a);
// console.log(b);