import { chromium } from 'playwright';
import fs from 'fs';
import 'dotenv/config'
// import { printSpiralSeats } from './utils.js';

export async function booking(page, data) {
  // await selectMovie(page);
  await test(page, data);
}

async function test(page, data) {
  const baseUrl = 'https://cgv.co.kr/cnm/selectVisitorCnt';
  // "coCd": "A420",
    // "movNo": "30001323", 아니;; 이것들 있으면 결제 안됨 멍미;
  const params = new URLSearchParams(
    Object.fromEntries(
      Object.entries(data).filter(
        ([key]) => key !== "coCd" && key !== "movNo"
      )
    )
  );

  await page.goto("https://cgv.co.kr/favicon.ico");
  
  const session = {
    query: JSON.stringify(data)
  }

  await page.evaluate((session) => {
    for (const [k, v] of Object.entries(session)) {
        sessionStorage.setItem(k, v);
    }
  }, session);

  await page.goto(`${baseUrl}?${params.toString()}`);

  // const buttonSelector = 'button.screenInfo_timeLink__45VfR.cinemaSchedule_scrollItemBtn__SzgMf';
  // // 요소가 클릭 가능할 때까지 기다린 후 클릭
  // await page.waitForSelector(buttonSelector, { state: 'visible' });
  // await page.click(buttonSelector);
  // console.log(`${a}?${params.toString()}`);
  // console.log("에우");
  // console.log(`${b}?${params.toString()}`);
}

async function selectMovie(page) {
  const baseUrl = 'https://cgv.co.kr/cnm/movieBook/movie';
  const params = new URLSearchParams({
    movNo:    process.env.MOVIE_NUMBER,
    scnYmd:   process.env.SCREEN_YMD,
    siteNo:   process.env.SITE_NUMBER,
    siteNm:   process.env.SITE_NAME,
    scnsNo:   process.env.SCREENS_NUMBER,
    // scnSseq:  process.env.SCREEN_SEQUENCE,
    // cr:       process.env.CINEMA_ROW
  });
  await page.goto(`${baseUrl}?${params.toString()}`);
}