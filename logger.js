import winston from "winston";

const logger = winston.createLogger({
  level: "info",

  format: winston.format.combine(
    winston.format.timestamp(),
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