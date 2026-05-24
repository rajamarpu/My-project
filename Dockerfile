FROM node:20-alpine

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY . .

ENV API_PORT=5000
ENV NODE_ENV=production

EXPOSE 5000

EXPOSE ${API_PORT}
CMD ["node", "backend/src/server.js"]
