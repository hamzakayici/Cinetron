# Cinetron

Self-hosted, modüler, cluster-ready medya sunucusu.

## Yapı

Bu proje bir monorepo'dur ve `pnpm` workspaces kullanır.

- **packages/server**: Node.js/NestJS API Backend
- **packages/web**: React + Tailwind Web UI
- **packages/media-engine**: Go tabanlı medya işleme motoru
- **packages/workers**: Arkaplan işçileri (Transcoding, Metadata, vb.)

## Hızlı Kurulum (Quick Start) 🚀

Cinetron'u tek komutla çalıştırabilirsiniz. Veritabanı, MinIO ve Admin hesabı otomatik oluşturulur.

### Gereksinimler
- Docker & Docker Compose

### Kurulum Adımları

1. Repoyu klonlayın:
   ```bash
   git clone https://github.com/hamzakayici/Cinetron.git
   cd Cinetron
   ```

2. Uygulamayı başlatın:
   ```bash
   docker-compose up -d --build
   ```
   *(İlk kurulumda build işlemi birkaç dakika sürebilir)*

3. Erişim:
   - **Web Arayüzü:** [http://localhost:3000](http://localhost:3000)
   - **MinIO Paneli:** [http://localhost:9001](http://localhost:9001)

### Giriş Bilgileri (Default Login) 🔐

Sistem otomatik olarak aşağıdaki yönetici hesabını oluşturur:

- **E-posta:** `admin@cinetron.com`
- **Şifre:** `admin123`

---

## Geliştirici Modu (Developer Setup)

Projeyi geliştirmek istiyorsanız:

1. Bağımlılıkları yükleyin:
   ```bash
   pnpm install
   ```

2. Altyapı servislerini başlatın:
   ```bash
   pnpm infra:up
   ```

3. Geliştirme modunda başlatın:
   ```bash
   pnpm dev
   ```
