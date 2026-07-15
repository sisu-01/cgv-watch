import { openAsBlob } from "node:fs";
import { initOffset, send_message, send_photo, waitCaptchaReply } from "../telegram/telegram.js";
import "dotenv/config";

let offset = initOffset();

export async function login(page) {
  // 로그인창으로 이동
  await page.goto("https://cgv.co.kr/mem/login");

  // 로딩 대기
  await page.waitForLoadState("networkidle");

  // id,pw 입력
  await page.locator("#loginInput1").fill(process.env.id);
  await page.locator("#loginInput2").fill(process.env.pw);

  // 캡챠 될 때 까지 뺑뺑이
  while (true) {
    // 캡챠 캡처(엌) 및 저장
    const canvas = page.locator('canvas[aria-label="캡차 이미지"]');
    await canvas.screenshot({ path: "login/captcha.png" });

    // 텔레그램 전송
    const photo = await openAsBlob("./login/captcha.png");
    const messageId = await send_photo(photo)

    // 텔레그램 답장 대기
    const { captchaText, nextOffset } = await waitCaptchaReply(messageId, offset);
    offset = nextOffset;

    // 캡챠 입력
    await page.locator("#loginInput3").fill(captchaText);

    // 로그인 버튼 클릭
    await page.locator('button[type="submit"]').click();

    // 캡챠 맞았니 틀렸니
    const isWrong = await verifyCaptcha(page);
    if (isWrong) {
      // 모달 닫고 캡챠 다시 진행
      await page.locator('section.modal-container button.fill-main').click();
      await send_message("캡챠 실패");
      continue;
    } else {
      await send_message("로그인 성공")
      break;
    }
  }
}

async function verifyCaptcha(page) {
  // 캡차 틀렸다고 팝업 뜨나 2초간 대기
  const modal = page.locator("section.modal-container");
  const isWrong = await modal.isVisible({ timeout: 2000 }).catch(() => false);
  return isWrong
}