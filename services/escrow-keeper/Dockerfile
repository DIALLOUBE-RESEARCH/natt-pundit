FROM node:22-alpine
WORKDIR /app
RUN apk add --no-cache ca-certificates && update-ca-certificates
COPY services/mcp/package.json ./package.json
RUN npm install --omit=dev && npm install bs58@4 --omit=dev
COPY services/mcp/*.mjs ./mcp/
COPY services/mcp/idl ./mcp/idl/
COPY services/escrow-keeper ./keeper/
WORKDIR /app/keeper
ENV ESCROW_KEEPER_PORT=4013
ENV PUNDIT_GATEWAY_URL=http://natt-pundit-gateway:4001
ENV NATT_PUNDIT_ESCROW_KEEPER_ENABLED=false
EXPOSE 4013
HEALTHCHECK CMD node -e "fetch('http://127.0.0.1:4013/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.mjs"]
