FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
COPY packages ./packages
COPY services/edge-api ./services/edge-api
RUN npm install -w @natt-pundit/edge-api
RUN npm run build -w @natt-pundit/contracts && npm run build -w @natt-pundit/natt-core && npm run build -w @natt-pundit/edge-api
WORKDIR /app/services/edge-api
EXPOSE 4002
CMD ["node", "dist/index.js"]
