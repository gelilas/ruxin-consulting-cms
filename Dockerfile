FROM node:22-bookworm-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY . .

ENV NODE_ENV=production
ENV API_PORT=4001

EXPOSE 4001

CMD ["npx", "tsx", "server/index.ts"]
