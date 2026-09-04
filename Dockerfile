# Production Multi-Stage Dockerfile for LifeLine HMS
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

COPY --from=builder /app/node_modules ./node_modules
COPY . .

EXPOSE 8080
CMD ["node", "server.js"]
