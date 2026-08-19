// 결제 가능 시간 연장 모달 감시
export async function watchPaymentTimeModal(page, signal) {
  const modal = page
    .locator('.cgv-modal.modal-alert')
    .filter({
      hasText: '결제 가능 시간이'
    });

  while (!signal.aborted) {
    try {
      if (await modal.isVisible()) {
        const confirmButton = modal.getByRole('button', {
          name: '확인',
          exact: true
        });

        await confirmButton.click();

        logger.info('결제 가능 시간 5분 연장');
      }
    } catch (error) {
      // 페이지 이동, 모달 제거 등 일시적인 오류는 무시
    }

    await page.waitForTimeout(200);
  }
}