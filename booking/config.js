// booking/config.js

import "dotenv/config";

export const config = {
  GROUP: process.env.GROUP,
  COUNT: process.env.COUNT,
  ROW_LIST: JSON.parse(process.env.ROW_LIST),
  COL_LIST: JSON.parse(process.env.COL_LIST)
}

// const START_ROW = process.env.START_ROW;
// const END_ROW = process.env.END_ROW;
// const START_COL = Number(process.env.START_COL);
// const END_COL = Number(process.env.END_COL);
//좌석 범위 목록들 정가운데서 시계방향으로 회오리~
// const TARGET_SEATS = printSpiralSeats(START_ROW, END_ROW, START_COL, END_COL);
// const TARGET_SEATS = JSON.parse(process.env.SEATS);