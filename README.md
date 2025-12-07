# Randevu Formu Backend

Bu proje, web formundan alınan randevu taleplerini e-posta olarak iletmek için oluşturulmuş basit bir Node.js API'sidir.

## Özellikler

- Form verilerini alıp e-posta olarak iletir
- Yandex Mail üzerinden e-posta gönderimi
- CORS destekli API endpoints
- Vercel üzerinde çalışmaya uygun yapılandırma

## Kurulum

1. Repoyu klonlayın:
```
git clone <repo-url>
cd randevu-backend
```

2. Bağımlılıkları yükleyin:
```
npm install
```

3. `.env` dosyasını düzenleyin:
```
PORT=3000
EMAIL_USER=your-email@yandex.com
EMAIL_PASSWORD=your-email-password
RECIPIENT_EMAIL=recipient@example.com
CORS_ORIGIN=* 
```

## Çalıştırma

Geliştirme modunda çalıştırmak için:
```
npm run dev
```

Üretim modunda çalıştırmak için:
```
npm start
```

## API Kullanımı

### Randevu Talebi Gönderme

```
POST /api/randevu

Body:
{
  "adSoyad": "İsim Soyisim",
  "telefon": "5554443322",
  "email": "ornek@mail.com",
  "tarih": "22.04.2001",
  "sikayet": "Şikayet metni burada"
}
```

## Vercel Dağıtımı

Bu proje Vercel'e deploy edilebilir. Vercel CLI ile deploy etmek için:

```
npm i -g vercel
vercel
``` 