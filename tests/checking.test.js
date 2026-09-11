import { expect, test } from "@playwright/test";
import { checking } from "../checking/checking";

test("예매 오픈 테스트", async () => {
  const config = {
    COUNT: "8",
    MOVIE_TITLE: "test",
    MOVIE_NUMBER: "test",
    SCREENS_NUMBER: "018",
    MOVIE_MIN_TIME: "0000",
    MOVIE_MAX_TIME: "2600",
    CGV_URL: "https://cgv.co.kr/api/v1/booking/searchMovScnInfo",
    CO_CD: "A420",
    SITE_NUMBER: "0013",
    RELEASE_CONTROL_SCOPE_CODE: "08",
    SCREEN_YMD: "20260912",
  };

  const result = await checking(config, true, true);
  expect(result).toBe(true);
});