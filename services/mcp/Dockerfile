FROM node:22-alpine
WORKDIR /app
RUN apk add --no-cache ca-certificates && update-ca-certificates
COPY services/mcp/package.json ./
RUN npm install --omit=dev
COPY services/mcp/server.js services/mcp/*.mjs services/mcp/server-card.json ./
COPY services/mcp/idl ./idl
ENV MCP_PORT=4012
ENV PUNDIT_GATEWAY_URL=http://natt-pundit-gateway:4001
ENV PUNDIT_EDGE_URL=http://natt-pundit-edge-api:4002
ENV PUBLIC_MCP_URL=https://hypernatt.com/mcp-pundit/protocol
EXPOSE 4012
HEALTHCHECK CMD node -e "fetch('http://127.0.0.1:4012/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
