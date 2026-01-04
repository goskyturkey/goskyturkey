const nodemailer = require('nodemailer');

// Email transporter (SMTP config)
const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
};

// Email şablonları
const emailTemplates = {
    bookingConfirmation: (booking) => ({
        subject: `Rezervasyon Onayı - ${booking.bookingRef}`,
        html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', sans-serif; background: #f5f5f5; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; }
          .header { background: linear-gradient(135deg, #1a1a2e, #2d2d5a); color: white; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; }
          .content { padding: 30px; }
          .booking-ref { background: #f0fdf4; border: 2px solid #10b981; border-radius: 10px; padding: 15px; text-align: center; margin: 20px 0; }
          .booking-ref span { font-size: 24px; font-weight: bold; color: #10b981; letter-spacing: 2px; }
          .details { background: #f8fafc; border-radius: 10px; padding: 20px; margin: 20px 0; }
          .details-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e2e8f0; }
          .details-row:last-child { border-bottom: none; }
          .total { font-size: 24px; font-weight: bold; color: #10b981; }
          .footer { background: #1a1a2e; color: rgba(255,255,255,0.7); padding: 20px; text-align: center; font-size: 12px; }
          .btn { display: inline-block; background: #e8793a; color: white; padding: 15px 30px; border-radius: 10px; text-decoration: none; font-weight: bold; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✈️ GoSky Turkey</h1>
            <p>Rezervasyonunuz Onaylandı!</p>
          </div>
          <div class="content">
            <p>Merhaba <strong>${booking.customerName}</strong>,</p>
            <p>Rezervasyonunuz başarıyla oluşturuldu. Aşağıda detayları bulabilirsiniz:</p>

            <div class="booking-ref">
              <p style="margin:0 0 5px; color:#64748b;">Rezervasyon Numarası</p>
              <span>${booking.bookingRef}</span>
            </div>

            <div class="details">
              <div class="details-row">
                <span>Aktivite</span>
                <strong>${booking.activity?.name || 'Tur'}</strong>
              </div>
              <div class="details-row">
                <span>Tarih</span>
                <strong>${new Date(booking.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
              </div>
              <div class="details-row">
                <span>Kişi Sayısı</span>
                <strong>${booking.guests || booking.participants} Kişi</strong>
              </div>
              <div class="details-row">
                <span>Toplam Tutar</span>
                <span class="total">₺${booking.totalPrice?.toLocaleString()}</span>
              </div>
            </div>

            <p><strong>📍 Önemli Bilgiler:</strong></p>
            <ul>
              <li>Aktivite günü 30 dakika önceden buluşma noktasında olunuz</li>
              <li>Rahat kıyafetler ve spor ayakkabı tercih ediniz</li>
              <li>Transfer hizmeti için otel adresinizi paylaşınız</li>
            </ul>

            <center>
              <a href="https://wa.me/905551234567" class="btn">💬 WhatsApp ile İletişim</a>
            </center>
          </div>
          <div class="footer">
            <p>© 2026 GoSky Turkey. Tüm hakları saklıdır.</p>
            <p>goskyturkey.com</p>
          </div>
        </div>
      </body>
      </html>
    `
    }),

    paymentSuccess: (booking) => ({
        subject: `Ödeme Onayı - ${booking.bookingRef}`,
        html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', sans-serif; background: #f5f5f5; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; }
          .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .footer { background: #1a1a2e; color: rgba(255,255,255,0.7); padding: 20px; text-align: center; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Ödeme Başarılı!</h1>
          </div>
          <div class="content">
            <p>Merhaba <strong>${booking.customerName}</strong>,</p>
            <p>₺${booking.totalPrice?.toLocaleString()} tutarındaki ödemeniz başarıyla tamamlandı.</p>
            <p><strong>Rezervasyon No:</strong> ${booking.bookingRef}</p>
            <p>İyi uçuşlar dileriz! ✈️</p>
          </div>
          <div class="footer">
            <p>© 2026 GoSky Turkey</p>
          </div>
        </div>
      </body>
      </html>
    `
    })
};

// Email gönderme fonksiyonu
const sendEmail = async (to, template, data) => {
    try {
        const transporter = createTransporter();
        const emailContent = emailTemplates[template](data);

        const info = await transporter.sendMail({
            from: `"GoSky Turkey" <${process.env.SMTP_USER}>`,
            to,
            subject: emailContent.subject,
            html: emailContent.html
        });

        console.log('Email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Email error:', error);
        return { success: false, error: error.message };
    }
};

module.exports = { sendEmail, emailTemplates };
