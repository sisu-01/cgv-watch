import { send_message } from "../telegram/telegram.js";
import logger from "../utils/logger.js";
import { useCNB } from "./payment.js";

// 결제 가능 시간 연장 모달 감시
export async function watchPaymentTimeModal(page, signal) {
  const extendModal = page.locator('.cgv-modal.modal-alert').filter({hasText: '결제 가능 시간이'});
  const cannotExtendModal = page.locator('.cgv-modal.modal-alert').filter({hasText: '결제 가능 시간을 연장할 수 없습니다'});
  const termsModal = page.locator('.cgv-modal.modal-alert').filter({hasText: '전체 약관에 동의해주세요'});

  while (!signal.aborted) {
    try {
      // 결제 가능 시간 연장
      if (await extendModal.isVisible()) {
        const confirmButton = extendModal.getByRole('button', {name: '확인',exact: true});
        await confirmButton.click();
        logger.info('결제 가능 시간 5분 연장');
      }
      // 결제 가능 시간 연장 불가능
      if (await cannotExtendModal.isVisible()) {
        const confirmButton = cannotExtendModal.getByRole('button', {name: '확인',exact: true});
        await confirmButton.click();
        logger.info('결제 가능 시간 연장 불가');
      }
      // 이용약관 씹힘
      if (await termsModal.isVisible()) {
        const confirmButton = termsModal.getByRole('button', {name: '확인',exact: true});
        await confirmButton.click();
        // 약관 동의
        const chkAll = page.locator('input#chkAll');
        while (!(await chkAll.isChecked())) {
          await chkAll.click({ force: true });
          await page.waitForTimeout(500);
        }
        await page.getByRole('button', { name: /결제하기$/ }).click();
        const CARD = process.env.CARD;
        let paymentCode = '';
        if (CARD === 'CNB')
          paymentCode = await useCNB(page);
        
        logger.info(`🎉 비상 예매 성공 ${paymentCode}`);
        // 결제창 10분 동안 브라우저 유지 및 결제 코드 계속 전송
        const interval = setInterval(async () => {
          await send_message(`🎉 예매 성공\n비상 결제 코드: ${paymentCode}`);
        }, 10 * 1000);
        await new Promise(resolve => setTimeout(resolve, 10 * 60 * 1000));
        
        clearInterval(interval);
      }
    } catch (error) {
      logger.error(error);
    }

    await page.waitForTimeout(200);
  }
}