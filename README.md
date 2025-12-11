# Cinetron

Self-hosted, modüler, cluster-ready medya sunucusu.

## Yapı

Bu proje bir monorepo'dur ve `pnpm` workspaces kullanır.

- **packages/server**: Node.js/NestJS API Backend
- **packages/web**: React + Tailwind Web UI
- **packages/media-engine**: Go tabanlı medya işleme motoru
- **packages/workers**: Arkaplan işçileri (Transcoding, Metadata, vb.)

## Kurulum

### Gereksinimler
- Node.js >= 18
- pnpm >= 8
- Go >= 1.21
- Docker & Docker Compose

### Başlangıç

1. Bağımlılıkları yükleyin:
   ```bash
   pnpm install
   ```

2. Altyapı servislerini (Postgres, Redis, MinIO) başlatın:
   ```bash
   pnpm infra:up
   ```

3. Geliştirme modunda başlatın:
   ```bash
   pnpm dev
   ```
