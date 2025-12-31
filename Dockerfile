# Base stage
FROM node:18-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Builder stage
FROM base AS builder
COPY . /usr/src/app
WORKDIR /usr/src/app
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm run build

# Server Image
FROM base AS server
RUN apk add --no-cache ffmpeg
COPY . /usr/src/app
WORKDIR /usr/src/app
COPY --from=builder /usr/src/app/packages/server/dist /usr/src/app/packages/server/dist
COPY --from=builder /usr/src/app/node_modules /usr/src/app/node_modules
COPY --from=builder /usr/src/app/packages/server/node_modules /usr/src/app/packages/server/node_modules
CMD [ "pnpm", "--filter", "@cinetron/server", "start:prod" ]

# Workers Image
FROM base AS workers
COPY . /usr/src/app
WORKDIR /usr/src/app
COPY --from=builder /usr/src/app/packages/workers/dist /usr/src/app/packages/workers/dist
COPY --from=builder /usr/src/app/node_modules /usr/src/app/node_modules
COPY --from=builder /usr/src/app/packages/workers/node_modules /usr/src/app/packages/workers/node_modules
CMD [ "pnpm", "--filter", "@cinetron/workers", "start" ]

# Media Engine Image (Go)
FROM golang:1.21-alpine AS media-engine-builder
WORKDIR /app
COPY packages/media-engine .
RUN go mod download
RUN go build -o /media-engine ./cmd/server

FROM alpine:latest AS media-engine
RUN apk add --no-cache ffmpeg
COPY --from=media-engine-builder /media-engine /media-engine
CMD ["/media-engine"]
