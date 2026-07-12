FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
COPY packages ./packages
COPY services/edge-api ./services/edge-api
# F86N v2 — fail prod build if proprietary engine missing or stub slipped in
RUN test -f packages/natt-edge-engine/package.json || (echo "MISSING natt-edge-engine — run scripts/ensure-edge-engine.sh on VPS" && exit 1)
RUN ! grep -q "Public mirror stub" packages/natt-edge-engine/src/index.ts 2>/dev/null || (echo "REFUSE stub engine in prod image" && exit 1)
RUN npm install -w @natt-pundit/edge-api
RUN npm run build -w @natt-pundit/contracts && npm run build -w @natt-pundit/natt-core && npm run build -w @natt-pundit/natt-edge-engine && npm run build -w @natt-pundit/edge-api
WORKDIR /app/services/edge-api
EXPOSE 4002
CMD ["node", "dist/index.js"]
