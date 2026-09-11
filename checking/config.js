// checking/config.js

import "dotenv/config";

export const config = {
  COUNT: process.env.COUNT,
  MOVIE_TITLE: process.env.MOVIE_TITLE,
  MOVIE_NUMBER: process.env.MOVIE_NUMBER,
  SCREENS_NUMBER: process.env.SCREENS_NUMBER,
  MOVIE_MIN_TIME: process.env.MOVIE_MIN_TIME,
  MOVIE_MAX_TIME: process.env.MOVIE_MAX_TIME,
  CGV_URL: process.env.CGV_URL,
  CO_CD: process.env.CO_CD,
  SITE_NUMBER: process.env.SITE_NUMBER,
  RELEASE_CONTROL_SCOPE_CODE: process.env.RELEASE_CONTROL_SCOPE_CODE,
  SCREEN_YMD: process.env.SCREEN_YMD,
};