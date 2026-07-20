import fs from "fs/promises";

export async function update_history(MOVIE_TITLE, SCREEN_YMD) {
  const data = JSON.parse(await fs.readFile("./history.json", "utf8"));

  const key = `${MOVIE_TITLE}|${SCREEN_YMD}`;
  const value = get_diff_days(SCREEN_YMD);
  
  data.history[key] = {
    "남은 일수": get_diff_days(SCREEN_YMD),
    "오픈 시각": get_current_time(),
  };
  
  await fs.writeFile(
    "./history.json",
    JSON.stringify(data, null, 2),
    "utf8"
  );
}

function get_diff_days(screenYmd) {
  const year = Number(screenYmd.slice(0, 4));
  const month = Number(screenYmd.slice(4, 6)) - 1; // JS는 0부터 시작
  const day = Number(screenYmd.slice(6, 8));

  const targetDate = new Date(year, month, day);
  const today = new Date();

  // 시간 제거 (00:00:00으로 맞춤)
  today.setHours(0, 0, 0, 0);
  targetDate.setHours(0, 0, 0, 0);

  const diffDays = Math.floor(
    (targetDate - today) / (1000 * 60 * 60 * 24)
  );

  return diffDays;
}

function get_current_time() {
  const now = new Date();

  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");

  return `${hh}:${mm}`;
}