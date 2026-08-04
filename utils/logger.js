import winston from "winston";

const logger = winston.createLogger({
  level: "info",

  format: winston.format.combine(
    winston.format.timestamp({
      format: () => {
        const date = new Date();

        const kstDate = new Date(
          date.toLocaleString("en-US", { timeZone: "Asia/Seoul" })
        );

        const year = kstDate.getFullYear();
        const month = String(kstDate.getMonth() + 1).padStart(2, "0");
        const day = String(kstDate.getDate()).padStart(2, "0");
        const hours = String(kstDate.getHours()).padStart(2, "0");
        const minutes = String(kstDate.getMinutes()).padStart(2, "0");
        const seconds = String(kstDate.getSeconds()).padStart(2, "0");
        const ms = String(date.getMilliseconds()).padStart(3, "0");

        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${ms}`;
      }
    }),

    // 추가
    winston.format.errors({ stack: true }),

    winston.format.printf(({ timestamp, level, message, stack }) => {
      return `${timestamp} [${level}] ${stack || message}`;
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