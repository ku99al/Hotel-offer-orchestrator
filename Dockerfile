# Build stage
FROM node:22-slim AS builder

WORKDIR /app

# 1. Copy package definitions first for Docker layer caching
COPY package*.json ./

# 2. Freshly install all dependencies inside the Linux container
RUN npm ci

# 3. Copy TypeScript configuration and source code after installing dependencies
COPY tsconfig.json ./
COPY src/ ./src/

# 4. Compile TypeScript into dist/
RUN npm run build

# Production stage
FROM node:22-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# 5. Copy package definitions to runner stage
COPY package*.json ./

# 6. Freshly install production-only dependencies inside the Linux container
RUN npm ci --omit=dev

# 7. Copy compiled artifacts from builder stage
COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/app.js"]
