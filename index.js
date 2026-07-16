import { chromium } from "playwright";
// import { checking } from "./checking/checking.js";
import { booking } from "./booking/booking.js";
import { login } from "./login/login.js";

// 브라우저 생성
const browser = await chromium.launch({ headless: false });
const context = await browser.newContext({
  viewport: { width: 1280, height: 900 }
});

const isAutoLogin = true;
if (isAutoLogin) {
  await context.addCookies([
    {
      name: 'accessToken',
      value: process.env.ACCESS_TOKEN,
      domain: 'cgv.co.kr',
      path: '/',
    },
    {
      name: 'refresh_token',
      value: process.env.REFRESH_TOKEN,
      domain: '.cgv.co.kr',
      path: '/',
    }
  ]);
}

const page = await context.newPage();

// 로그인
if (!isAutoLogin) {
  await login(page);
}
// const a = checking();
const data = {
      "coCd": "A420",
      "siteNo": "0013",
      "siteNm": "CGV 용산아이파크몰",
      "scnsNo": "001",
      "scnsNm": "1관 (Laser)",
      "expoScnsNm": "1관 (Hamilton Watch Odyssey)",
      "scnsEnm": "CINEMA 1",
      "atktPsblQty": "8",
      "scnYmd": "20260805",
      "scnSseq": "1",
      "prodNo": "20054562",
      "expoProdNm": "오디세이",
      "engProdNm": "The Odyssey",
      "prodNm": "오디세이",
      "movkndCd": "02",
      "movkndDsplNm": "2D",
      "movkndDsplEnm": "2D",
      "cratgClsCd": "02",
      "cratgClsNm": "15세이상관람가",
      "salsTznCd": "01",
      "salsTznNm": "모닝",
      "scnsrtTm": "0730",
      "scnendTm": "1032",
      "salEndTm": "0745",
      "sascnsGradCd": "01",
      "sortOseq": "5",
      "sascnsGradNm": "일반",
      "tcscnsGradCd": "01",
      "tcscnsGradNm": "일반",
      "stcnt": "204",
      "cpSeatCnt": "204",
      "frSeatCnt": "144",
      "cntlYn": "N",
      "crntrvDsplYn": "N",
      "hotdlYn": "N",
      "dblfrNo": null,
      "dblfrRpsntYn": null,
      "iceconYn": "N",
      "arthsYn": "N",
      "srlsYn": "N",
      "childnMovYn": "N",
      "movclsCd": "01",
      "movclsNm": "영화",
      "speclIndctTypCd": "01",
      "movTirCd": "01",
      "siteGradCd": "01",
      "srvltKindCd": "01",
      "slddKindCd": "01",
      "sesnNo": null,
      "movNo": "30001323",
      "movNm": "오디세이",
      "movEnm": "The Odyssey",
      "mvSeatCnt": "2",
      "movfNo": "50002601",
      "bzplcNo": "0013001",
      "vatincYn": "Y",
      "prdtypCd": "01",
      "prddtlTypCd": "0101",
      "prdcmpTypCd": "01",
      "cxprdYn": "N",
      "scnsGradCd": "0101",
      "prcrulDivCd": "01",
      "videoAddexpCd": null,
      "videoAddexpCdNm": null,
      "videoAddexpCont": null,
      "sbtdivCd": null,
      "sbtdivNm": null,
      "physcFnm": "30001323_185.jpg",
      "physcFilePathnm": "030001/30001323/30001323_185.jpg",
      "frtmpSeatCnt": "144",
      "hotdlDtlNo": null,
      "rlMovStartTm": "0740",
      "prmddNo": null,
      "prmddNm": null,
      "prodImg": null,
      "cndProdYn": null,
      "cndsaTypCd": null,
      "cndSalYnList": null
    };
await booking(page, data);

// const b = await booking(a);
// console.log(b);