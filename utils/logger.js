import winston from "winston";

const logger = winston.createLogger({
  level: "info",

  format: winston.format.combine(
    winston.format.timestamp({
      format: () => {
        const date = new Date();
        // 한국 시간(Asia/Seoul) 기준의 ISO 문자열에서 'Z'를 제거하고 포맷팅
        const kstDate = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
        
        const year = kstDate.getFullYear();
        const month = String(kstDate.getMonth() + 1).padStart(2, "0");
        const day = String(kstDate.getDate()).padStart(2, "0");
        const hours = String(kstDate.getHours()).padStart(2, "0");
        const minutes = String(kstDate.getMinutes()).padStart(2, "0");
        const seconds = String(kstDate.getSeconds()).padStart(2, "0");
        const ms = String(date.getMilliseconds()).padStart(3, "0");

        // 💡 익숙하고 깔끔한 형태 (예: 2026-07-28 20:15:00.123)
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${ms}`;
      }
    }),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level}] ${message}`;
    })
  ),

  transports: [
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error"
    }),

    new winston.transports.File({
      filename: "logs/app.log"
    }),

    new winston.transports.Console()
  ]
});

export default logger;