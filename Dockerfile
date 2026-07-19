FROM node:20-alpine

WORKDIR /app

RUN addgroup -g 1001 app && adduser -u 1001 -G app -D app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY src ./src
COPY scripts ./scripts

USER app

EXPOSE 5000

CMD ["node", "src/server.js"]
