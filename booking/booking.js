import { chromium } from 'playwright';
import fs from 'fs';
import 'dotenv/config'
import { printSpiralSeats } from './utils.js';
import { isAlreadySelectedModal } from './utils.js';
import { send_message } from '../telegram/telegram.js';

const GROUP = process.env.GROUP;
const COUNT = process.env.COUNT;
const START_ROW = process.env.START_ROW;
const END_ROW = process.env.END_ROW;
const START_COL = Number(process.env.START_COL);
const END_COL = Number(process.env.END_COL);
const CNB = process.env.CARD;

async function goToBookingPage(page, data) {
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

  // origin cgv로 하면서 로딩 빠르게
  await page.goto("https://cgv.co.kr/favicon.ico");
  
  // session storage 설정
  const session = {
    query: JSON.stringify(data)
  }
  await page.evaluate((session) => {
    for (const [k, v] of Object.entries(session)) {
      sessionStorage.setItem(k, v);
    }
  }, session);

  await page.goto(`${baseUrl}?${params.toString()}`);
}

async function selectSeats (page) {
  //좌석 범위 목록들 정가운데서 시계방향으로 회오리~
  const TARGET_SEATS = printSpiralSeats(START_ROW, END_ROW, START_COL, END_COL);
  // console.log(TARGET_SEATS);
  
  // 이선좌 뜨면 첨부터 ㅠㅠㅠ 이선좌: 이미 선택된 좌석입니다.
  // 최대 도전 회수
  let retryCount = 0;
  let isSuccess = false;
  while (retryCount < 20 && !isSuccess) {
    retryCount++;
    // console.log("loop", retryCount);

    // 인원 선택
    const generalSection = page.locator('div[aria-labelledby="number-choice-label"]').nth(GROUP);
    const targetButton = generalSection.locator(`button[aria-label="${COUNT} 선택"]`);
    await targetButton.waitFor({ state: 'visible' }); 
    await targetButton.click();
    await page.locator('button', { hasText: /^선택$/ }).click();

    //좌석 선택
    let seatIndex = 0;
    let isSeatSelected = false;
    while (seatIndex < TARGET_SEATS.length && !isSeatSelected) {
      // console.log(seatIndex, TARGET_SEATS.length, !isSeatSelected);
      const currentSeatName = TARGET_SEATS[seatIndex];
      // console.log(`[시도] ${currentSeatName} 좌석 확인 중...`);
      // 정규식을 사용해 해당 좌석 번호의 2번째(진짜) 버튼 지정
      // 미리보기 그거때문에 두개임 ㅇㅇ
      const seatLocator = page.getByRole('button').filter({ hasText: currentSeatName }).nth(1);
      try {
        // 1. 만약 이미 선택된 좌석(disabled)이라면 바로 pass
        if (await seatLocator.isDisabled()) {
          // console.log(`❌ ${currentSeatName} 좌석은 이미 매진되었습니다. 다음 좌석으로 넘어갑니다.`);
          seatIndex++; // 다음 좌석 인덱스로
          continue;
        }
        const title = await seatLocator.getAttribute('title');
        if (title === '선택됨') {
          // console.log(`⚠️ ${currentSeatName} 좌석은 내가 선택한 좌석입니다.`);
          seatIndex++;
          continue;
        }  
        // 2. 선택 가능한 좌석이라면 클릭 시도!
        // console.log(`✅ ${currentSeatName} 좌석 선택 성공!`);
        await seatLocator.click();

        // 선택완료 버튼 비활성화 돼있음.. 아직 선택안된 인원이 있는 것
        const finishLocator = page.getByRole('button').filter({ hasText: /^선택완료$/ });
        if (await finishLocator.isDisabled()) {
          // console.log('하지만 아직 더 남았다.');
          seatIndex++; // 다음 좌석 인덱스로
          continue;
        }
        // console.log(`✅ 전좌석 선택 완료!`);
        isSeatSelected = true; // 루프 탈출 조건 충족
        isSuccess = true;
      } catch (error) {
        // 로딩이 안 되었거나 unexpected 에러 발생 시 안전하게 다음으로 패스
        // console.log(`⚠️ ${currentSeatName} 탐색 중 에러 발생 (패스합니다)`);
        seatIndex++;
      }
    }
    if (!isSeatSelected) {
      // console.log("😭 준비한 모든 좌석이 매진되었습니다.");

      return false;
    }
    await page.getByRole('button').filter({ hasText: /^선택완료$/ }).click();
    const isAlready = await isAlreadySelectedModal(page);
    if (isAlready) {
      // console.log('⚠️ 이선좌 발생');
      // console.log(`좌석 재시도 ${retryCount}/20`);
      await page.getByRole('button', { name: '확인' }).click();
      continue;
    } else {
      break;
    }
  }
  // console.log("이선좌 컷~!");
  await page.getByRole('button', { name: /결제하기$/ }).click();
  await page.getByRole('button', { name: /결제하기$/ }).nth(1).click();
  return true;
}

export async function payment (page) {
  // cgv 결제창
  await page.waitForLoadState('networkidle');
  // 약관 동의
  await page.locator('input#chkAll').click({ force: true });
  // 앱카드 클릭
  await page.getByRole('button', { name: '앱카드' }).click();
  await page.locator('select#select1234').click();
  await page.locator(`button#${CNB}`).click();
  return true;
  await page.getByRole('button', { name: /결제하기$/ }).click();

  //kb 결제창
  await page.locator('#kmotion-link').click();
  const textCode = await page.locator('#tcode').innerText();
  // console.log("결제코드:", textCode);
  return textCode;
}

export async function booking(page, data) {
  try {
    await goToBookingPage(page, data);
    const isSuccess = await selectSeats(page);
    if (!isSuccess) {
      send_message("😭 실패했어요 ㅠㅠㅠ");
      return false;
    }
    const textCode = await payment(page);
    await send_message(textCode);
    return true;
  } catch (error) {
    await send_message(error);
    return false;
  }
}