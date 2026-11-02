import axios from "axios";
import { Agent, setGlobalDispatcher } from "undici";
import logger from "../utils/logger.js"

setGlobalDispatcher(
  new Agent({
    connect: {
      ciphers: "DEFAULT"
    }
  })
);

export async function fetchCgvSchedule(url){
  const startedAt = Date.now();
  try {
    const res = await axios.get(
      url,
      {
        headers:{
          "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/150 Safari/537.36",
          "referer": "https://cgv.co.kr/"
        }
      }
    );
    return res.data;
  } catch (error) {
    const response = error.response;

    logger.error(
      JSON.stringify({
        message: error.message,

        // HTTP 응답
        status: response?.status,
        statusText: response?.statusText,

        // 어떤 URL을 호출했는지
        url: error.config?.url,
        method: error.config?.method,

        // 서버가 내려준 헤더
        responseHeaders: response?.headers,

        // 서버가 내려준 실제 body
        responseData:
          typeof response?.data === "string"
            ? response.data.slice(0, 3000)
            : response?.data,

        // 요청 당시 Axios 설정
        requestHeaders: error.config?.headers,

        // 걸린 시간
        elapsedMs: Date.now() - startedAt
      })
    );

    return null;
  }
}