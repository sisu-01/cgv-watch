FROM mcr.microsoft.com/playwright:v1.61.1-jammy

ENV TZ=Asia/Seoul

RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime \
 && echo $TZ > /etc/timezone

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN mkdir -p /app/logs

RUN chmod +x start.sh

ENV NODE_ENV=production

CMD ["./start.sh"]