FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
COPY packages ./packages
COPY services/commentary-service ./services/commentary-service
RUN npm install -w @natt-pundit/commentary-service
RUN npm run build -w @natt-pundit/contracts && npm run build -w @natt-pundit/natt-core && npm run build -w @natt-pundit/commentary-service
WORKDIR /app/services/commentary-service
RUN mkdir -p /data/tts-cache
EXPOSE 4003
CMD ["node", "dist/index.js"]
