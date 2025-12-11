# Cinetron Mimari Dökümantasyonu

## Genel Bakış
Cinetron, modüler ve ölçeklenebilir bir medya sunucusudur. Monorepo yapısında geliştirilmiş olup, microservice mimarisine geçişe uygun tasarlanmıştır.

## Bileşenler

### 1. Server (`packages/server`)
- **Teknoloji**: NestJS (Node.js)
- **Görevi**: REST API, Authentication, Veritabanı yönetimi.
- **Veritabanı**: PostgreSQL (Users, Media Metadata).

### 2. Media Engine (`packages/media-engine`)
- **Teknoloji**: Go
- **Görevi**: Yüksek performanslı medya işleme, Transcoding (FFmpeg), GPU yönetimi.
- **İletişim**: Redis aracılığıyla asenkron job processing.

### 3. Web UI (`packages/web`)
- **Teknoloji**: React + Vite + Tailwind CSS.
- **Görevi**: Kullanıcı arayüzü, Medya oynatma, Yönetim paneli.

### 4. Workers (`packages/workers`)
- **Teknoloji**: Node.js (BullMQ)
- **Görevi**: Metadata indirme (TMDB), Altyazı bulma, Thumbnail oluşturma.

### 5. Plugin System (`packages/plugin-api`)
- **Görevi**: Sisteme dışarıdan özellik eklenmesini sağlayan arayüz.

## Veri Akışı
1. **Medya Ekleme**: Kullanıcı bir klasörü taratır -> Server dosyaları bulur -> DB'ye kaydeder -> Metadata Worker tetiklenir.
2. **İzleme**: Kullanıcı "Play"e basar -> Web UI playlist ister -> Server streaming endpoint'i döner -> Media Engine (gerekirse) transcode eder.

## Altyapı
- **PostgreSQL**: Kalıcı veri saklama.
- **Redis**: Job Queue ve Cache.
- **MinIO**: Medya dosyaları ve asset (poster) depolama.
