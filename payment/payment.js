import { screenCaptureAndSaveHtml } from '../booking/utils.js';
import { watchPaymentTimeModal } from './utils.js';
import { send_message } from '../telegram/telegram.js';
import logger from "../utils/logger.js";

const COUNT = Number(process.env.COUNT);
const USE_TICKET = process.env.USE_TICKET === 'true';
const CARD = process.env.CARD;

export async function payment (page) {
  try {
    const controller = new AbortController();
    const modalWatcher = watchPaymentTimeModal(page, controller.signal);
    
    // cgv 결제창
    await page.waitForLoadState('networkidle');
    
    // 약관 동의
    const chkAll = page.locator('input#chkAll');
    while (!(await chkAll.isChecked())) {
      await chkAll.click({ force: true });
      await page.waitForTimeout(500);
    }
      
    let isComplete = false;
    let paymentCode = null;
    if (USE_TICKET) {
      isComplete = await useTicket(page);
    } else {
      paymentCode = await useAppCard(page);
    }
    
    
    // 영화 관람권을 쓰면 이후 결제 필요 없으니까 isComplete고,
    // 앱카드 썼으면 수동 결제 필요하니까 isComplete false에 paymentCode return
    return {
      isComplete: isComplete,
      paymentCode: paymentCode
    }
  } catch (error) {
    await send_message("payment 결제 실패");
    logger.error(error) ;
    return {
      isComplete: false,
      paymentCode: null
    }
  }
}

// 영화관람권
async function useTicket(page) {
  try {

    // CGV영화관람권/기프트콘 클릭
    const btn = await page.getByRole('button', { name: 'CGV영화관람권/기프트콘', exact: true});
    await btn.waitFor({state: 'visible',timeout: 60000});
    await btn.click();
    await page.waitForLoadState('networkidle');

    // 관람권 인원수만큼 반복문 클릭
    const coupons = page.locator('input[name="movGft"]:not(#mov-none)');
    for (let i = 0; i < COUNT; i++) {
      const coupon = coupons.nth(i);
      const couponId = await coupon.getAttribute('id');
      await page.locator(`label[for="${couponId}"]`).click();

      // 실제 체크 상태가 될 때까지 대기
      await page.waitForFunction(
        el => el.checked,
        await coupon.elementHandle()
      );
    }
    
    // 적용 및 결제
    await page.getByRole('button', { name: /적용하기$/ }).click();
    await page.getByRole('button', { name: /결제하기$/ }).click();
    return true;
  } catch (error) {
    logger.error(error);
    screenCaptureAndSaveHtml(page);
    return false;
  }
}

// 앱카드 클릭
async function useAppCard(page) {
  try {
    const appCard = await page.getByRole('button', { name: '앱카드' });
    await appCard.click({timeout: 99999999});
    await page.locator('select#select1234').click();
    await page.locator(`button#${CARD}`).click();
    await page.getByRole('button', { name: /결제하기$/ }).click();

    if (CARD === 'CNB')
      return await useCNB(page);

  } catch (error) {
    logger.error(error);
    screenCaptureAndSaveHtml(page);
    return null;
  }
}

// KB국민은행
export async function useCNB(page) {
  try {
    // 클릭
    await page.waitForLoadState('domcontentloaded');
    const kmotionLink = page.locator('#kmotion-link');
    await kmotionLink.waitFor({
      state: 'visible'
    });
    await page.waitForLoadState('load');
    await kmotionLink.click();
  
    // 로딩 기다려서 결제코드 잘 보기
    const tcode = page.locator('#tcode');
    await tcode.waitFor({ state: 'visible' });
    await page.waitForFunction(
      el => el.innerText.trim() !== '',
      await tcode.elementHandle()
    );
    const paymentCode = await tcode.innerText();
  
    return paymentCode;
  } catch (error) {
    logger.error(error);
    return null;
  }
}

