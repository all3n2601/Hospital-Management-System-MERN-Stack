# Stage 1: Builder
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production=false
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Stage 2: Runner
FROM node:20-alpine AS runner
WORKDIR /app
RUN addgroup -g 1001 -S nodejs \
 && adduser -S -u 1001 -G nodejs nodeuser
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
USER nodeuser
EXPOSE 4451
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:4451/api/v1/health || exit 1
CMD ["node", "dist/server.js"]
