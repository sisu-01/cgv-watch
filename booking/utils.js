import fs from "fs/promises";

export async function waitAndChangeModalTransform(page) {
  let prev = "";
  await page.waitForFunction(() => {
    const el = document.querySelector(".react-transform-component");
    return el?.style.transform ?? "";
  });
  while (true) {
    const current = await page.locator(".react-transform-component")
      .evaluate(el => el.style.transform);
    if (current === prev) {
      break; // 더 이상 transform이 안 바뀜
    }
    prev = current;
    await page.waitForTimeout(100);
  }
  await page.evaluate(() => {
    document.querySelector(".react-transform-component").style.transform =
      "translate(0px, 0px) scale(0.3)";
  });
}

export function printSpiralSeats(startRow, endRow, startCol, endCol) {
  const rows = [];

  for (
    let c = startRow.charCodeAt(0);
    c <= endRow.charCodeAt(0);
    c++
  ) {
    rows.push(String.fromCharCode(c));
  }

  const cols = [];
  for (let i = startCol; i <= endCol; i++) {
    cols.push(i);
  }

  const rowCount = rows.length;
  const colCount = cols.length;

  let r = Math.floor(rowCount / 2);
  let c = Math.floor(colCount / 2);

  const total = rowCount * colCount;
  const visited = new Set();
  const seats = []; // 추가

  function printIfValid(r, c) {
    if (
      r >= 0 &&
      r < rowCount &&
      c >= 0 &&
      c < colCount
    ) {
      const seat = `${rows[r]}${cols[c]}`;

      if (!visited.has(seat)) {
        visited.add(seat);
        seats.push(seat); // console.log 대신 추가
      }
    }
  }

  printIfValid(r, c);

  const dr = [0, 1, 0, -1];
  const dc = [1, 0, -1, 0];

  let step = 1;
  let dir = 0;

  while (visited.size < total) {
    for (let repeat = 0; repeat < 2; repeat++) {
      for (let i = 0; i < step; i++) {
        r += dr[dir];
        c += dc[dir];
        printIfValid(r, c);
      }

      dir = (dir + 1) % 4;
    }

    step++;
  }

  return seats;
}

export async function isAlreadySelectedModal(page) {
  const modal = page.getByText(
    '선택하신 좌석은 이미 다른 고객이 예매 중인 좌석입니다'
  );
  for (let i = 0; i < 20; i++) { // 최대 2초
    if (await modal.isVisible().catch(() => false)) {
      return true;
    }

    await page.waitForTimeout(100);
  }
  return false;
}

export async function screenCaptureAndSaveHtml(page, tabIndex = 0) {
  try {
    await fs.mkdir("./debug", { recursive: true });

    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-");

    // 현재 화면 캡처
    await page.screenshot({
      path: `./debug/TAB-${tabIndex+1}-${timestamp}.png`,
      fullPage: true,
    });

    // 현재 HTML 저장
    const html = await page.content();
    await fs.writeFile(
      `./debug/TAB-${tabIndex+1}-${timestamp}.html`,
      html,
      "utf8"
    );
  } catch (err) {
    console.error("스크린샷 실패", err);
  }
}