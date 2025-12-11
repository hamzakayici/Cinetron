# --- Builder Stage (Node) ---
FROM node:18-alpine AS node-builder
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app
COPY . .

# Install dependencies and build
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm run build

# --- Builder Stage (Go) ---
FROM golang:1.21-alpine AS go-builder
WORKDIR /build
COPY packages/media-engine .
RUN go mod download
RUN go build -o /media-engine ./cmd/server

# --- Final Stage ---
FROM node:18-alpine

# Install system dependencies
RUN apk add --no-cache ffmpeg nginx supervisor curl

# Create directory structure
WORKDIR /app

# Copy built artifacts from Node builder
COPY --from=node-builder /app/node_modules /app/node_modules
COPY --from=node-builder /app/packages/server/dist /app/packages/server/dist
COPY --from=node-builder /app/packages/server/node_modules /app/packages/server/node_modules
COPY --from=node-builder /app/packages/workers/dist /app/packages/workers/dist
COPY --from=node-builder /app/packages/workers/node_modules /app/packages/workers/node_modules
COPY --from=node-builder /app/packages/web/dist /app/packages/web/dist

# Copy built artifacts from Go builder
COPY --from=go-builder /media-engine /app/media-engine

# Copy configuration files
COPY deployment/aio/supervisord.conf /etc/supervisord.conf
COPY deployment/aio/nginx.conf /etc/nginx/nginx.conf

# Expose Web Port
EXPOSE 80

# Start Supervisor
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
