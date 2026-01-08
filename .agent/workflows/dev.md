# Hızlı Development Workflow

## Hibrit Yaklaşım (En Hızlısı)

MongoDB Docker'da, Backend ve Frontend lokal çalışır. CSS değişiklikleri **anında** yansır!

### 1. Sadece MongoDB'yi Başlat
```bash
docker compose up -d mongodb
```

### 2. Backend'i Lokal Başlat
```bash
cd backend
npm run dev
```
> Backend `localhost:3000` üzerinde çalışır, değişikliklerde otomatik restart olur.

### 3. Frontend'i Lokal Başlat (Yeni Terminal)
```bash
cd frontend
npm run dev
```
> Frontend `localhost:3001` üzerinde çalışır + **Hot Reload** aktif!

---

## Avantajlar

| Docker Build | Hibrit (Lokal) |
|-------------|----------------|
| ~3-4 dakika | **< 1 saniye** |
| Her değişiklikte rebuild | Anında HMR |

## Canlıya Deploy

Değişiklikler tamamlandığında:
```bash
docker compose down && docker compose up -d --build
```
