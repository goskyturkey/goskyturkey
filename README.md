# GoSky Turkey Web Application

Modern Next.js + Node.js web uygulaması Docker ile.

## 🚀 Teknoloji Stack

- **Frontend:** Next.js 16.1.1, React 19.2.3
- **Backend:** Express.js 5.2.1, Node.js 24 LTS
- **Veritabanı:** MongoDB 8
- **Ödeme:** iyzico Payment Gateway
- **Konteyner:** Docker + PM2

## 🚀 Hızlı Başlangıç

### Docker ile Çalıştırma

```bash
# Build ve başlat
docker-compose up -d --build

# Logları görüntüle
docker-compose logs -f

# Durdur
docker-compose down
```

### Geliştirme Ortamı

```bash
# Frontend
cd frontend
npm install
npm run dev

# Backend (ayrı terminalde)
cd backend
npm install
npm run dev
```

## 📁 Proje Yapısı

```
├── frontend/          # Next.js 16 uygulaması
│   ├── app/           # App Router pages
│   ├── components/    # React bileşenleri
│   ├── lib/           # Utility fonksiyonları
│   └── next.config.js
├── backend/           # Express.js API
│   ├── routes/        # API endpoints
│   ├── models/        # MongoDB modelleri
│   ├── middleware/    # Auth, rate limiting
│   └── server.js
├── Dockerfile
└── docker-compose.yml
```

## 🌐 Deployment

Nginx Proxy Manager ayarları:

- Domain: `goskyturkey.com`
- Forward Hostname: `goskyturkey`
- Forward Port: `3000` (Backend API), `3001` (Frontend)
- SSL: Aktif (Force SSL)

## 📡 API Endpoints

### Public

- `GET /api/health` - Sistem durumu
- `GET /api/activities` - Aktivite listesi
- `POST /api/bookings` - Yeni rezervasyon

### Admin (JWT gerekli)

- `GET /api/admin/bookings` - Tüm rezervasyonlar
- `PUT /api/admin/bookings/:id` - Rezervasyon güncelle

## 🔒 Güvenlik

- Helmet.js (XSS, CORS güvenliği)
- Rate Limiting (100 istek/15 dk)
- JWT Authentication
- bcrypt password hashing
