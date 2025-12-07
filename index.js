require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');
const axios = require('axios');

const app = express();
app.set('trust proxy', 1); // Güvenlik duvarı veya proxy arkasında çalışıyorsa gerekli (Heroku, Vercel, Nginx vb.)
const PORT = process.env.PORT || 3000;

// reCAPTCHA secret key
const RECAPTCHA_SECRET_KEY = '6LfcyRsrAAAAAMYSPRNamCVq2i544BMpscZJS-Qk';
// public 6LfcyRsrAAAAAI_sUBUx-2EzTd6mDzB81ce6ZiI3
// Middleware
app.use(express.json());
app.use(cors());

// IP başına günde 3 istek ile sınırlama yapan rate limiter
const apiLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 saat (1 gün)
  max: 3, // IP başına maksimum 3 istek
  message: {
    success: false,
    message: 'Çok fazla istek yaptınız. Lütfen 24 saat sonra tekrar deneyin.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// reCAPTCHA v3 doğrulama fonksiyonu
async function verifyRecaptchaV3(captchaToken) {
  try {
    const response = await axios.post(
      'https://www.google.com/recaptcha/api/siteverify',
      null,
      {
        params: {
          secret: RECAPTCHA_SECRET_KEY,
          response: captchaToken
        }
      }
    );

    const data = response.data;

    // v3 puanı kontrol et (0.0 - 1.0 arası)
    if (data.success && data.score !== undefined) {
      // 0.5'in üzerindeki skorlar genellikle insan olarak kabul edilir
      // Ancak güvenliği artırmak için eşiği yükseltebilirsiniz
      console.log(`reCAPTCHA Skoru: ${data.score}, Eylem: ${data.action}`);
      return {
        success: data.score >= 0.5,
        score: data.score,
        action: data.action
      };
    }

    return {
      success: false,
      score: 0,
      action: null
    };
  } catch (error) {
    console.error('reCAPTCHA doğrulama hatası:', error);
    return {
      success: false,
      score: 0,
      action: null
    };
  }
}

// E-posta gönderme fonksiyonu
async function sendEmail(formData) {
  // E-posta taşıyıcısı oluşturma
  const transporter = nodemailer.createTransport({
    host: 'smtp.yandex.ru',
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  // Şikayet metni kontrolü
  const sikayetHtml = formData.sikayet ?
    `<tr>
      <td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: bold; color: #444;">Şikayet</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">${formData.sikayet}</td>
    </tr>` : '';


  // HTML E-posta içeriği
  const mailOptions = {
    from: `"Randevu" <${process.env.EMAIL_USER}>`,
    to: process.env.RECIPIENT_EMAIL,
    subject: `Yeni Randevu Talebi - ${formData.adSoyad}`,
    html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Yeni Randevu Talebi</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
          background-color: #f9f9f9;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          text-align: center;
          padding: 20px 0;
        }
        .logo {
          margin-bottom: 15px;
        }
        .title {
          color: #064E8E;
          font-size: 24px;
          font-weight: bold;
          margin: 10px 0;
        }
        .subtitle {
          color: #555;
          font-size: 16px;
        }
        .content {
          background-color: white;
          padding: 25px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
          margin-bottom: 20px;
        }
        .info-box {
          background-color: #F0F7FF;
          border-left: 4px solid #064E8E;
          padding: 12px 15px;
          margin: 20px 0;
          border-radius: 0 4px 4px 0;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        table td {
          padding: 12px;
          border-bottom: 1px solid #eee;
          color: #333;
        }
        table td:first-child {
          font-weight: bold;
          width: 35%;
          color: #444;
        }
        .highlight {
          background-color: #FFF9E6;
          border-left: 4px solid #FFB300;
          padding: 12px 15px;
          margin: 20px 0;
          border-radius: 0 4px 4px 0;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          font-size: 12px;
          color: #777;
          padding-top: 15px;
          border-top: 1px solid #eee;
        }
        .button {
          display: inline-block;
          background-color: #064E8E;
          color: white;
          text-decoration: none;
          padding: 10px 20px;
          border-radius: 4px;
          margin-top: 15px;
          font-weight: bold;
        }
        .kvkk {
          background-color: #e8f4ff;
          padding: 12px 15px;
          border-left: 4px solid #064E8E;
          margin-top: 20px;
          font-size: 13px;
          border-radius: 0 4px 4px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">



          </div>
          <div class="title">Yeni Randevu Talebi</div>
          <div class="subtitle">Randevu sistemi aracılığıyla yeni bir talep alındı</div>
        </div>
        
        <div class="content">
          <div class="info-box">
            <strong>Randevu Bilgileri:</strong> Aşağıda hasta tarafından gönderilen randevu talebi bilgileri yer almaktadır.
          </div>
          
          <table>
            <tr>
              <td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: bold; color: #444;">Ad Soyad</td>
              <td style="padding: 12px; border-bottom: 1px solid #eee;"><strong>${formData.adSoyad}</strong></td>
            </tr>
            <tr>
              <td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: bold; color: #444;">Telefon</td>
              <td style="padding: 12px; border-bottom: 1px solid #eee;">${formData.telefon}</td>
            </tr>
            <tr>
              <td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: bold; color: #444;">E-posta</td>
              <td style="padding: 12px; border-bottom: 1px solid #eee;"><a href="mailto:${formData.email}" style="color: #064E8E; text-decoration: none;">${formData.email}</a></td>
            </tr>
            <tr>
              <td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: bold; color: #444;">Hizmet</td>
              <td style="padding: 12px; border-bottom: 1px solid #eee;">${formData.hizmetSecin}</td>
            </tr>
            <tr>
              <td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: bold; color: #444;">Tarih</td>
              <td style="padding: 12px; border-bottom: 1px solid #eee;">${formData.tarih}</td>
            </tr>
           
            ${sikayetHtml}
          </table>
          
          <div class="kvkk">
            <strong>Bilgilendirme:</strong> Hasta, KVKK Aydınlatma Metni'ni okumuş ve onaylamıştır.
          </div>
          
          <div style="text-align: center; margin-top: 25px;">
            <a href="tel:${formData.telefon}" class="button" style="color: white !important;">Hasta ile İletişime Geç</a>
          </div>
        </div>
        
        <div class="footer">
          <p>Bu e-posta, Jasmin Digital randevu talep formu aracılığıyla otomatik olarak gönderilmiştir.</p>
          <p>©️ 2025 Jasmindigital - Tüm Hakları Saklıdır.</p>
          <p>
            <a href="https://www.jasmindigital.com.tr" style="color: #064E8E; text-decoration: none;">www.jasmindigital.com.tr</a>
          </p>
        </div>
      </div>
    </body>
    </html>
    `,
    // Düz metin alternatifi (HTML desteklemeyen e-posta istemcileri için)
    text:
      `Yeni bir randevu talebi alındı:
    
Ad Soyad: ${formData.adSoyad}
Telefon: ${formData.telefon}
E-posta: ${formData.email}
Hizmet: ${formData.hizmetSecin}
Tarih: ${formData.tarih}

${formData.sikayet ? `Şikayet: ${formData.sikayet}` : ''}
    
`
  };

  // E-postayı gönder
  return await transporter.sendMail(mailOptions);
}

// Randevu talebi alma endpoint'i - rate limiter ve reCAPTCHA v3 uygulandı
app.post('/api/randevu', apiLimiter, async (req, res) => {
  try {
    // reCAPTCHA v3 doğrulama
    const captchaToken = req.body.captcha;

    if (!captchaToken) {
      return res.status(400).json({
        success: false,
        message: 'reCAPTCHA doğrulaması gereklidir.'
      });
    }

    const recaptchaResult = await verifyRecaptchaV3(captchaToken);

    if (!recaptchaResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Güvenlik doğrulaması başarısız oldu. Lütfen tekrar deneyin.'
      });
    }

    // reCAPTCHA eylem kontrolü - randevu formundan geldiğinden emin olun
    if (recaptchaResult.action && recaptchaResult.action !== 'randevu_form') {
      console.warn(`Beklenen eylem 'randevu_form', alınan: ${recaptchaResult.action}`);
    }

    const formData = {
      adSoyad: req.body.adSoyad,
      telefon: req.body.telefon,
      email: req.body.email,
      hizmetSecin: req.body.hizmetSecin,
      tarih: req.body.tarih,
      sikayet: req.body.sikayet
    };

    // Form verilerinin kontrolü
    if (!formData.adSoyad || !formData.telefon || !formData.email || !formData.hizmetSecin || !formData.tarih) {
      return res.status(400).json({ success: false, message: 'Lütfen tüm zorunlu alanları doldurun.' });
    }

    // E-posta gönderme
    await sendEmail(formData);

    res.status(200).json({ success: true, message: 'Randevu talebiniz başarıyla alındı.' });
  } catch (error) {
    console.error('İşlem hatası:', error);
    res.status(500).json({ success: false, message: 'Randevu talebi iletilemedi. Lütfen daha sonra tekrar deneyin.' });
  }
});

// Sağlık kontrolü endpoint'i
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Uygulamayı dinlemeye başla
app.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda çalışıyor.`);
}); 