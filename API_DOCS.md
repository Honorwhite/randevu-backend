# Randevu API Dokümantasyonu

## Genel Bakış
Bu API, ortopedi ve travmatoloji randevu sistemi için tasarlanmıştır. Google reCAPTCHA v3 ile korunmaktadır ve IP başına günlük istek sınırlaması bulunmaktadır.

## Base URL
```
http://localhost:3000
```

## Güvenlik
- **reCAPTCHA v3**: Tüm form gönderimlerinde gerekli
- **Rate Limiting**: IP başına günde 3 istek sınırı
- **CORS**: Tüm originlere açık

---

## Endpoints

### POST /api/randevu

Yeni randevu talebi oluşturur ve e-posta gönderir.

#### Request Headers
```
Content-Type: application/json
```

#### Request Body
```json
{
  "adSoyad": "string (required)",
  "telefon": "string (required)", 
  "email": "string (required)",
  "hizmetSecin": "string (required)",
  "tarih": "string (required, YYYY-MM-DD format)",
  "sikayet": "string (optional)",
  "captcha": "string (required, reCAPTCHA token)"
}
```

#### Parametre Açıklamaları

| Parametre | Tip | Zorunlu | Açıklama |
|-----------|-----|---------|----------|
| `adSoyad` | string | ✅ | Hastanın ad ve soyadı |
| `telefon` | string | ✅ | Telefon numarası |
| `email` | string | ✅ | E-posta adresi (geçerli format) |
| `hizmetSecin` | string | ✅ | Seçilen hizmet türü |
| `tarih` | string | ✅ | Tercih edilen randevu tarihi (YYYY-MM-DD) |
| `sikayet` | string | ❌ | Hasta şikayeti/mesajı |
| `captcha` | string | ✅ | Google reCAPTCHA v3 token |


#### Response

**Success (200)**
```json
{
  "success": true,
  "message": "Randevu talebiniz başarıyla alındı."
}
```

**Validation Error (400)**
```json
{
  "success": false,
  "message": "Lütfen tüm zorunlu alanları doldurun."
}
```

**reCAPTCHA Error (400)**
```json
{
  "success": false,
  "message": "Güvenlik doğrulaması başarısız oldu. Lütfen tekrar deneyin."
}
```

**Rate Limit Error (429)**
```json
{
  "success": false,
  "message": "Çok fazla istek yaptınız. Lütfen 24 saat sonra tekrar deneyin."
}
```

**Server Error (500)**
```json
{
  "success": false,
  "message": "Randevu talebi iletilemedi. Lütfen daha sonra tekrar deneyin."
}
```

---

### GET /health

Sunucu durumunu kontrol eder.

#### Response

**Success (200)**
```json
{
  "status": "ok"
}
```

---

## reCAPTCHA v3 Entegrasyonu

### Site Key
```
6Lc0tiorAAAAAECUOvJJe9mUYWqCjC7J7mKg7kV4
```

### JavaScript Örneği
```javascript
// reCAPTCHA token alma
const token = await grecaptcha.execute('6Lc0tiorAAAAAECUOvJJe9mUYWqCjC7J7mKg7kV4', {
    action: 'randevu_form'
});

// API çağrısı
const response = await fetch('/api/randevu', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        adSoyad: "John Doe",
        telefon: "555 123 45 67",
        email: "john@example.com",
        hizmetSecin: "ortopedi",
        tarih: "2025-08-01",
        sikayet: "Diz ağrısı",
        captcha: token
    })
});
```

---

## Rate Limiting

- **Sınır**: IP başına günde 3 istek
- **Pencere**: 24 saat
- **Sıfırlanma**: Her 24 saatte bir otomatik
- **Aşım Durumu**: 429 HTTP status kodu döner

---

## E-posta Sistemi

### Yapılandırma
- **SMTP Server**: smtp.yandex.ru
- **Port**: 465 (SSL)
- **Authentication**: Gerekli

### Çevre Değişkenleri
```env
EMAIL_USER=your-email@yandex.com
EMAIL_PASSWORD=your-app-password
RECIPIENT_EMAIL=doctor@example.com
```

### E-posta İçeriği
- HTML formatında profesyonel tasarım
- Hasta bilgileri tablo formatında
- KVKK uyumluluk bildirimi
- Doktor için hızlı iletişim butonu

---

## Örnek İstekler

### cURL Örneği
```bash
curl -X POST http://localhost:3000/api/randevu \
  -H "Content-Type: application/json" \
  -d '{
    "adSoyad": "Ahmet Yılmaz",
    "telefon": "532 123 45 67", 
    "email": "ahmet@example.com",
    "hizmetSecin": "ortopedi",
    "tarih": "2025-08-15",
    "sikayet": "Sol diz ağrısı 2 haftadır devam ediyor",
    "captcha": "03AGdBq25..."
  }'
```

### JavaScript Fetch Örneği
```javascript
const formData = {
    adSoyad: "Mehmet Kaya",
    telefon: "505 987 65 43",
    email: "mehmet@example.com", 
    hizmetSecin: "spor-yaralanmalari",
    tarih: "2025-08-20",
    sikayet: "Futbol oynarken ayak bileği burkulması",
    captcha: await grecaptcha.execute('SITE_KEY', {action: 'randevu_form'})
};

fetch('/api/randevu', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(formData)
})
.then(response => response.json())
.then(data => console.log(data));
```

---

## Hata Kodları

| HTTP Status | Açıklama | Çözüm |
|-------------|----------|-------|
| 200 | Başarılı | - |
| 400 | Geçersiz veri | Form alanlarını kontrol edin |
| 429 | Rate limit aşımı | 24 saat bekleyin |
| 500 | Sunucu hatası | Tekrar deneyin veya destek alın |

---

## Güvenlik Notları

1. **reCAPTCHA**: Her istekte geçerli token gerekli
2. **Rate Limiting**: IP tabanlı koruma aktif
3. **Input Validation**: Tüm girişler doğrulanır
4. **Email Sanitization**: XSS koruması mevcut
5. **HTTPS**: Üretimde SSL kullanın

---

## Versiyonlama

**Mevcut Versiyon**: v1.0  
**Son Güncelleme**: 2025-07-31

## Destek

Teknik destek için: developer@jasmindigital.com.tr