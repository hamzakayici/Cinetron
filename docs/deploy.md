# Cinetron Deployment Guide

## Prerequisites
- Docker & Docker Compose
- Kubernetes Cluster (Optional for production)
- pnpm

## Local Development
1. Install dependencies:
   ```bash
   pnpm install
   ```
2. Start infrastructure:
   ```bash
   pnpm infra:up
   ```
3. Start development server:
   ```bash
   pnpm dev
   ```

## Production Deployment (Docker Compose)
Use the root `docker-compose.yml` (to be created for prod) or build images manually.

```bash
docker build -f Dockerfile --target server -t cinetron/server .
docker build -f Dockerfile --target workers -t cinetron/workers .
docker build -f packages/web/Dockerfile -t cinetron/web .
```

## Kubernetes (Helm)
1. Package the chart:
   ```bash
   helm package infra/helm/cinetron
   ```
2. Install:
   ```bash
   helm install cinetron ./cinetron-0.1.0.tgz
   ```
