import { chromium } from "playwright";

import "dotenv/config";

const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;

let browser;
browser = await chromium.launch({
  headless: false,
  args: [
    "--disable-gpu",
    "--disable-dev-shm-usage",
    "--disable-software-rasterizer",
    "--disable-extensions",
    "--disable-plugins",
    "--disable-popup-blocking",
    "--disable-renderer-backgrounding",
    "--disable-background-networking",
    "--mute-audio",
    "--no-first-run",
  ]
});
const context = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  locale: "ko-KR",
  timezoneId: "Asia/Seoul",
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36",
  extraHTTPHeaders: {
    "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
    "Upgrade-Insecure-Requests": "1",
    "DNT": "1",
  },
});

await context.addCookies([
  {
    name: 'accessToken',
    value: ACCESS_TOKEN,
    domain: 'cgv.co.kr',
    path: '/',
  },
  {
    name: 'refresh_token',
    value: REFRESH_TOKEN,
    domain: '.cgv.co.kr',
    path: '/',
  }
]);

const page = await context.newPage();
await page.goto("https://cgv.co.kr/robots.txt");
const baseUrl = "https://cgv.co.kr/cnm/selectVisitorCnt";

// const data = {
//     coCd: "A420",
//     movNo: "30001783",
//     scnYmd: "20261125",
//     scnsNo: "018",
//     siteNo: "0013",
//     scnSseq: "2",
//     cxprdYn: "N",
//     dblfrRpsntYn: "N",
//     prodNo: "20058964",
//     hotdlYn: "N"
// }

const data = {
  coCd: 'A420',
  movNo: '30001783',
  scnYmd: '20261126',
  scnsNo: '018',
  siteNo: '0013',
  scnSseq: '5',
  cxprdYn: "N",
  dblfrRpsntYn: "N", //수요일 더블 적립?
  prodNo: '20058964',
  hotdlYn: "N",




  siteNm: 'CGV 용산아이파크몰',
  scnsNm: 'IMAX관',
  expoScnsNm: 'IMAX관',
  scnsEnm: 'IMAX',
  atktPsblQty: '4',
  expoProdNm: '임영웅│아임 히어로 더 스타디움 2(IMAX LASER 2D)',
  engProdNm: '(IMAX LASER 2D)LIM YOUNG WOONG│IM HERO THE STADIUM 2',
  prodNm: '임영웅│아임 히어로 더 스타디움 2(IMAX LASER 2D)',
  movkndCd: '48',
  movkndDsplNm: 'IMAX LASER 2D',
  movkndDsplEnm: 'IMAX LASER 2D',
  cratgClsCd: '04',
  cratgClsNm: '전체관람가',
  salsTznCd: '26',
  salsTznNm: '일반',
  scnsrtTm: '2225',
  scnendTm: '2459',
  salEndTm: '2240',
  sascnsGradCd: '01',
  sortOseq: '3',
  sascnsGradNm: '일반',
  tcscnsGradCd: '03',
  tcscnsGradNm: '아이맥스',
  stcnt: '624',
  cpSeatCnt: '624',
  frSeatCnt: '620',
  cntlYn: 'N',
  crntrvDsplYn: 'N',
  dblfrNo: null,
  iceconYn: 'Y',
  arthsYn: 'N',
  srlsYn: 'N',
  childnMovYn: 'N',
  movclsCd: '01',
  movclsNm: '영화',
  speclIndctTypCd: '01',
  movTirCd: '01',
  siteGradCd: '01',

  
  srvltKindCd: '01',
  slddKindCd: '01',
  sesnNo: null,
  movNm: '임영웅│아임 히어로 더 스타디움 2',
  movEnm: 'LIM YOUNG WOONG│IM HERO THE STADIUM 2',
  mvSeatCnt: '6',
  movfNo: '50003314',
  bzplcNo: '0013001',
  vatincYn: 'Y',
  prdtypCd: '01',
  prddtlTypCd: '0101',
  prdcmpTypCd: '01',
  scnsGradCd: '0301',
  prcrulDivCd: '01',
  videoAddexpCd: null,
  videoAddexpCdNm: null,
  videoAddexpCont: null,
  sbtdivCd: null,
  sbtdivNm: null,
  physcFnm: '30001783_185.jpg',
  physcFilePathnm: '030001/30001783/30001783_185.jpg',
  frtmpSeatCnt: '624',
  hotdlDtlNo: null,
  rlMovStartTm: '2235',
  prmddNo: null,
  prmddNm: null,
  prodImg: null,
  cndProdYn: null,
  cndsaTypCd: null,
  cndSalYnList: null
}

const params = new URLSearchParams(
// "coCd": "A420",
// "movNo": "30001323", 아니;; 이것들 있으면 결제 안됨 멍미;
  Object.fromEntries(
    Object.entries(data).filter(
      ([key]) => key !== "coCd" && key !== "movNo"
    )
  )
);

// session storage 설정
const session = {
  query: JSON.stringify(data)
}
await page.evaluate((session) => {
  for (const [k, v] of Object.entries(session)) {
    sessionStorage.setItem(k, v);
  }
}, session);

await page.goto(`${baseUrl}?${params.toString()}`);