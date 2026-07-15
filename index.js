import { chromium } from "playwright";

import { checking } from "./checking/checking.js";
import { booking } from "./booking/booking.js";
import { login } from "./login/login.js";

// 브라우저 생성
const browser = await chromium.launch({ headless: false });
const context = await browser.newContext({
  viewport: { width: 1280, height: 900 }
});
const page = await context.newPage();

// 로그인
login(page);

// const a = checking();
// const b = await booking(a);
// console.log(b);