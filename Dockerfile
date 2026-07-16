FROM mcr.microsoft.com/playwright:v1.61.1-jammy

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN mkdir -p /app/logs

RUN chmod +x start.sh

ENV NODE_ENV=production

CMD ["./start.sh"]