import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",

  use: {
    headless: true,

    viewport: {
      width: 1280,
      height: 900,
    },

    locale: "ko-KR",
    timezoneId: "Asia/Seoul",

    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36",

    extraHTTPHeaders: {
      "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
      "Upgrade-Insecure-Requests": "1",
      "DNT": "1",
    },

    actionTimeout: 150_000,
    navigationTimeout: 150_000,

    launchOptions: {
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
      ],
    },
  },
});