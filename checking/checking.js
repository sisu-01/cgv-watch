// checking/checking.js

import { send_message } from "../telegram/telegram.js";
import { fetchCgvSchedule } from "./cgv.js";
import { findEarliestScreening, findEarliestScreeningForTesting } from "./utils.js"
import 'dotenv/config'
import logger from "../utils/logger.js"

export async function checking(config, isDev = false, test = false) {
  const {
    COUNT,
    MOVIE_TITLE,
    MOVIE_NUMBER,
    SCREENS_NUMBER,
    MOVIE_MIN_TIME,
    MOVIE_MAX_TIME,
    CGV_URL,
    CO_CD,
    SITE_NUMBER,
    RELEASE_CONTROL_SCOPE_CODE,
    SCREEN_YMD
  } = config;
  const params = new URLSearchParams({
    coCd: CO_CD,
    siteNo: SITE_NUMBER,
    rtctlScopCd: RELEASE_CONTROL_SCOPE_CODE,
    scnYmd: SCREEN_YMD
  });
  const BASE_URL = `${CGV_URL}?${params}`;

  // 0~5000ms 랜덤 대기
  // const delay = Math.floor(Math.random() * 5000);
  // await new Promise(resolve => setTimeout(resolve, delay));

  await send_message(`CGV 감시 시작 👀\n\n인원: ${COUNT}\n제목: ${MOVIE_TITLE}\n상영일: ${SCREEN_YMD}\n상영 시각: ${MOVIE_MIN_TIME}~${MOVIE_MAX_TIME}`);
  logger.info(`CGV 감시 시작 인원: ${COUNT}\n제목: ${MOVIE_TITLE}\n상영일: ${SCREEN_YMD}\n상영 시각: ${MOVIE_MIN_TIME}~${MOVIE_MAX_TIME}`);

  let previous = isDev ? "[]" : null;
  let lastHeartbeatDate = "";

  while (true) {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    
    try {
      const data = await fetchCgvSchedule(BASE_URL);
      if (!data || !Array.isArray(data.data)) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        continue;
      }
      const current = JSON.stringify(data.data);
      // if (isDev) {
      //   logger.info(previous);
      //   logger.info(current);
      // }
      
      if (previous && previous !== current) {
        const result = findEarliestScreening(
          data.data,
          MOVIE_NUMBER,
          SCREENS_NUMBER,
          MOVIE_MIN_TIME,
          MOVIE_MAX_TIME
        );
        if (result) {
          // send_message('발견');
          // logger.info('발견');
          return result;
        }
        if (test && current.includes("\"scnsNo\":\"018\"")) {
          return findEarliestScreeningForTesting(data.data, SCREENS_NUMBER);
        }
        // send_message("상영관은 열렸지만 선택한 것은 없음.");
        // logger.info("상영관은 열렸지만 선택한 것은 없음.");
      }
      previous = current;

      //12시 알림
      if (
        now.getHours() === 12 &&
        now.getMinutes() === 0 &&
        today !== lastHeartbeatDate
      ) {
        send_message(`${MOVIE_TITLE} ${SCREEN_YMD} 감시 정상 동작 중`);
        logger.info(`${MOVIE_TITLE} ${SCREEN_YMD} 감시 정상 동작 중`);
        lastHeartbeatDate = today;
      }
      await new Promise(resolve => setTimeout(resolve, 5000));
    } catch (error) {
      send_message('checking.js\n', error);
      logger.error(error);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}