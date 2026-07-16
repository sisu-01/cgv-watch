import axios from "axios";
import { Agent, setGlobalDispatcher } from "undici";

setGlobalDispatcher(
  new Agent({
    connect: {
      ciphers: "DEFAULT"
    }
  })
);

export async function fetchCgvSchedule(){
  const res = await axios.get(
    process.env.CGV_URL,
    {
      headers:{
        "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/150 Safari/537.36",

        "referer":
        "https://cgv.co.kr/"
      }
    }
  );

  return res.data;
}