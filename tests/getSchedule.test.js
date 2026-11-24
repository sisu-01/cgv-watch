import { fetchCgvSchedule } from "#src/checking/cgv.js";

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
  SCREEN_YMD: "20261126",
};
const {
  CGV_URL,
  CO_CD,
  SITE_NUMBER,
  RELEASE_CONTROL_SCOPE_CODE,
  SCREEN_YMD
} = checking_config;
const params = new URLSearchParams({
  coCd: CO_CD,
  siteNo: SITE_NUMBER,
  rtctlScopCd: RELEASE_CONTROL_SCOPE_CODE,
  scnYmd: SCREEN_YMD
});
const BASE_URL = `${CGV_URL}?${params}`;
const data = await fetchCgvSchedule(BASE_URL);
console.log(typeof(data));
data.data
.filter(e => e.scnsNo === '018')
.forEach(e => {
  console.log(e);
  // console.log(`${e.scnSseq} ${e.scnsrtTm}-${e.scnendTm} ${e.prodNo} ${e.prodNm} ${e.expoScnsNm}`);
});