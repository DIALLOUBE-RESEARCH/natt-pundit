FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
COPY packages ./packages
COPY services/txline-gateway ./services/txline-gateway
COPY fixtures ./fixtures
RUN npm install -w @natt-pundit/txline-gateway
RUN npm run build -w @natt-pundit/contracts && npm run build -w @natt-pundit/natt-core && npm run build -w @natt-pundit/txline-gateway
WORKDIR /app/services/txline-gateway
EXPOSE 4001
CMD ["node", "dist/index.js"]
