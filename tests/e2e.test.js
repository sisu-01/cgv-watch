import { expect, test } from "@playwright/test";
import { login } from "../login/login";
import { checking } from "../checking/checking";
import { booking } from "../booking/booking";
import { getTomorrowYmd } from "../utils/utils";

test("E2E", async ({ page }) => {
  const loginSuccess = await login(page);
  expect(
    loginSuccess,
    "로그인 실패"
  ).toBe(true);

  const checking_config = {
    COUNT: "4",
    MOVIE_TITLE: "test",
    MOVIE_NUMBER: "test",
    SCREENS_NUMBER: "018",
    MOVIE_MIN_TIME: "0000",
    MOVIE_MAX_TIME: "2600",
    CGV_URL: "https://cgv.co.kr/api/v1/booking/searchMovScnInfo",
    CO_CD: "A420",
    SITE_NUMBER: "0013",
    RELEASE_CONTROL_SCOPE_CODE: "08",
    SCREEN_YMD: getTomorrowYmd(),
  };
  const movieData = await checking(checking_config, true, true);
  expect(
    movieData,
    "예매 조회 실패"
  ).toBeTruthy();

  const readyUrl = "https://cgv.co.kr/robots.txt";
  await page.goto(readyUrl);

  const booking_config = {
    GROUP: "0",
    COUNT: "4",
    ROW_LIST: ["16"],
    COL_LIST: ["H"]
  }
  const tabIndex = 0;
  const { testSuccess } = await booking(
    page,
    booking_config,
    movieData,
    tabIndex
  );
  expect(testSuccess).toBe(true);
});