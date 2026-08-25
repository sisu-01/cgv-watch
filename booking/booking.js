import { chromium } from 'playwright';
import fs from 'fs';
import 'dotenv/config'
import { printSpiralSeats, screenCaptureAndSaveHtml, waitAndChangeModalTransform } from './utils.js';
import { isAlreadySelectedModal } from './utils.js';
import { send_message } from '../telegram/telegram.js';
import logger from "../utils/logger.js"

const GROUP = process.env.GROUP;
const COUNT = process.env.COUNT;
const START_ROW = process.env.START_ROW;
const END_ROW = process.env.END_ROW;
const START_COL = Number(process.env.START_COL);
const END_COL = Number(process.env.END_COL);
// const TARGET_SEATS = JSON.parse(process.env.SEATS);

export async function booking(page, data) {
  try {
    await goToBookingPage(page, data);
    const isSuccess = await selectSeats(page);    
    return isSuccess;
  } catch (error) {
    await send_message('booking.js\n', error);
    await screenCaptureAndSaveHtml(page);
    logger.error(error);
    return false;
  }
}

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
  // logger.info("예매 페이지 이동");
}

async function selectSeats (page) {
  //좌석 범위 목록들 정가운데서 시계방향으로 회오리~
  const TARGET_SEATS = printSpiralSeats(START_ROW, END_ROW, START_COL, END_COL);
    
  // 이선좌 뜨면 첨부터 ㅠㅠㅠ 이선좌: 이미 선택된 좌석입니다.
  // 최대 도전 회수
  let retryCount = 0;
  let isSuccess = false;

  const start = performance.now();

  while (retryCount < 20 && !isSuccess) {
    retryCount++;

    // 인원 선택
    const generalSection = page.locator('div[aria-labelledby="number-choice-label"]').nth(GROUP);
    const targetButton = generalSection.locator(`button[aria-label="${COUNT} 선택"]`);
    await targetButton.waitFor({ state: 'visible' }); 
    await targetButton.click();
    await page.locator('button', { hasText: /^선택$/ }).click();

    // 속도 타협 x
    // const generalSection = page.locator('div[aria-labelledby="number-choice-label"]').nth(GROUP);
    // const targetButton = generalSection.locator(`button[aria-label="${COUNT} 선택"]`);
    // await targetButton.evaluate(el => el.click());
    // await page.locator('button', { hasText: /^선택$/ }).evaluate(el => el.click());

    // 좌석 선택
    let seatIndex = 0;
    let isSeatSelected = false;

    // 모든 좌석 클릭 가능하게 화면 줄이기
    await waitAndChangeModalTransform(page);

    const seatMap = new Map(
      await page.locator("button[data-seatlocno]").evaluateAll(buttons =>
        buttons
          .slice(buttons.length / 2)
          .map(el => [
            el.innerText.trim(),
            {
              seatlocno: el.getAttribute("data-seatlocno"),
              disabled: el.disabled,
              title: el.title,
            }
          ])
      )
    );

    while (seatIndex < TARGET_SEATS.length && !isSeatSelected) {
      try {
        // 좌석 index
        const currentSeatName = TARGET_SEATS[seatIndex];
        const seatInfo = seatMap.get(currentSeatName);
        
        // 0. 좌석 존재 여부 확인
        if (!seatInfo) {
          // console.log(`❌ ${currentSeatName} 좌석은 존재하지 않습니다. 다음 좌석으로 넘어갑니다.`);
          seatIndex++; // 다음 좌석 인덱스로
          continue;
        }
        // 1. 내가 선택한 좌석이면 pass
        if (seatInfo.title === '선택됨') {
          // console.log(`⚠️ ${currentSeatName}: 이미 선택됨.`);
          seatIndex++;
          continue;
        }
        // 2. 만약 이미 선택된 좌석(disabled)이라면 바로 pass
        if (seatInfo.disabled) {
          // console.log(`❌ ${currentSeatName} 좌석은 이미 매진되었습니다. 다음 좌석으로 넘어갑니다.`);
          seatIndex++; // 다음 좌석 인덱스로
          continue;
        }
        
        // 3. 선택 가능한 좌석이라면 클릭 시도!
        const seatLocator = page.locator(`button[data-seatlocno="${seatInfo.seatlocno}"]`).nth(1);
        await seatLocator.click();
       
        // 4. 현재 선택된 좌석만 가져오기
        const selectedSeats = await page
          .locator('button[data-seatlocno][title="선택됨"]')
          .evaluateAll(buttons =>
            buttons.slice(buttons.length / 2)
            .map(el => el.innerText.trim())
          );

        // 5. seatMap 반영
        for (const seatName of selectedSeats) {
          const seatInfo = seatMap.get(seatName);

          if (seatInfo) {
            seatMap.set(seatName, {
              ...seatInfo,
              title: "선택됨"
            });
          }
        }

        // 모두 선택 됐니?
        // 아니요 돌아갈게요.
        if (Number(COUNT) !== selectedSeats.length) {
          // console.log('하지만 아직 더 남았다.');
          seatIndex++; // 다음 좌석 인덱스로
          continue;
        }
        // console.log(`✅ 전좌석 선택 완료!`);
        isSeatSelected = true; // 루프 탈출 조건 충족
        isSuccess = true;
      } catch (error) {
        logger.error(error);
        seatIndex++;
      }
    }
    //안쪽 while 종료 지점 !

    // 에러 났거나,, 전체 순회했는데도 예매 못 한 경우.. ㅠㅠ
    if (!isSeatSelected) {
      logger.info("😭 준비한 모든 좌석이 매진되었습니다.");
      await screenCaptureAndSaveHtml(page);
      return false;
    }


    // 개발용 딜레이
    // await new Promise(resolve => setTimeout(resolve, 5 * 1000));
    
    // 테스트해보자
    await screenCaptureAndSaveHtml(page);

    await page.getByRole('button').filter({ hasText: /^선택완료$/ }).click();

    const isAlready = await isAlreadySelectedModal(page);
    if (isAlready) {
      logger.info(`이선좌 ${retryCount}/20`);
      const modal = page
        .locator(".cgv-modal")
        .filter({
          hasText: "선택하신 좌석은 이미 다른 고객이 예매 중인 좌석입니다",
        });

      const confirmButton = modal.getByRole("button", {
        name: "확인",
        exact: true,
      });

      await confirmButton.click();
      logger.info('이선좌 확인 클릭 완료');

      // 해당 이선좌 모달 자체가 DOM에서 제거될 때까지 대기
      await modal.waitFor({ state: "detached" });
      logger.info('이선좌 모달 detached');

      // searchSiteByPosiStoNo pending 끝나야 예매창 사라지는데,
      // 사람 몰리면 예매창이 늦게 사라진다.
      await page.waitForFunction(() => {
        // 0: 좌석 선택, 1: 좌석 선택에서 인원 변경, 2: 임직원 번호 입력
        const modal = document.querySelectorAll('.cgv-modal.cgv-bot-modal')[0];

        return modal && !modal.classList.contains('active');
      });
      logger.info('좌석 선택 모달 inactive');

      isSuccess = false;
      continue;
    } else {
      break;
    }
  }
  const end = performance.now();
  send_message(`${end - start} ms`);

  // searchSiteByPosiStoNo pending 끝나야 예매창 사라지는데,
  // 사람 몰리면 예매창이 늦게 사라진다.
  await page.waitForFunction(() => {
    // 0: 좌석 선택, 1: 좌석 선택에서 인원 변경, 2: 임직원 번호 입력
    const modal = document.querySelectorAll('.cgv-modal.cgv-bot-modal')[0];

    return modal && !modal.classList.contains('active');
  });
  
  await page.getByRole('button', { name: /결제하기$/ }).click();
  await page.getByRole('button', { name: /결제하기$/ }).nth(1).click();
  return true;
}