FROM node:22-alpine AS builder
WORKDIR /app
ARG NEXT_PUBLIC_TXLINE_GATEWAY_URL=https://hypernatt.com/api/natt-pundit/txline
ARG NEXT_PUBLIC_EDGE_API_URL=https://hypernatt.com/api/natt-pundit/edge
ARG NEXT_PUBLIC_BASE_PATH=/fr/nattpundit
ENV NEXT_PUBLIC_TXLINE_GATEWAY_URL=$NEXT_PUBLIC_TXLINE_GATEWAY_URL
ENV NEXT_PUBLIC_EDGE_API_URL=$NEXT_PUBLIC_EDGE_API_URL
ENV NEXT_PUBLIC_BASE_PATH=$NEXT_PUBLIC_BASE_PATH
COPY package.json package-lock.json* .npmrc ./
COPY packages ./packages
COPY apps/web ./apps/web
RUN npm install -w @natt-pundit/web
RUN npm run build -w @natt-pundit/contracts && npm run build -w @natt-pundit/web

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
