require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Activity = require('./models/Activity');
const Settings = require('./models/Settings');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📦 MongoDB Connected');

    // Admin kullanıcı oluştur
    const existingAdmin = await User.findOne({ email: 'admin@goskyturkey.com' });
    if (!existingAdmin) {
      await User.create({
        email: 'admin@goskyturkey.com',
        password: 'admin123',
        name: 'Admin',
        role: 'admin',
        isActive: true
      });
      console.log('✅ Admin kullanıcı oluşturuldu: admin@goskyturkey.com / admin123');
    } else {
      console.log('ℹ️ Admin kullanıcı zaten mevcut');
    }

    // Örnek aktiviteler - tek tek oluştur (pre-save hook çalışsın)
    const activitiesCount = await Activity.countDocuments();
    if (activitiesCount === 0) {
      const activities = [
        {
          name: 'Yamaç Paraşütü Deneyimi',
          description: 'Profesyonel pilotlarımız eşliğinde gökyüzünde unutulmaz bir deneyim yaşayın. Fethiye Ölüdeniz\'in muhteşem manzarasını kuşbakışı görün.',
          shortDescription: 'Ölüdeniz\'de profesyonel tandem uçuş',
          category: 'paragliding',
          price: 3500,
          discountPrice: 2800,
          currency: 'TRY',
          duration: '30-40 dakika',
          location: 'Fethiye, Ölüdeniz',
          meetingPoint: 'Ölüdeniz Sahil Meydanı',
          includes: ['Profesyonel pilot', 'Ekipman', 'Sigorta', 'Video/Fotoğraf'],
          excludes: ['Ulaşım', 'Yemek'],
          maxParticipants: 20,
          isActive: true,
          isFeatured: true,
          order: 1
        },
        {
          name: 'Gyrocopter Turu',
          description: 'Gyrocopter ile gökyüzünde özgürce süzülün. Deneyimli pilotlarımız ile güvenli ve heyecan verici bir uçuş deneyimi. Ege kıyılarının muhteşem manzarasını keşfedin.',
          shortDescription: 'Gyrocopter ile panoramik uçuş',
          category: 'gyrocopter',
          price: 4500,
          currency: 'TRY',
          duration: '20-30 dakika',
          location: 'Denizli, Pamukkale',
          meetingPoint: 'Pamukkale Havalimanı yakını',
          includes: ['Profesyonel pilot', 'Tüm ekipman', 'Sigorta'],
          excludes: ['Ulaşım', 'Video kaydı'],
          maxParticipants: 10,
          isActive: true,
          isFeatured: true,
          order: 2
        },
        {
          name: 'Pamukkale Balon Turu',
          description: 'Pamukkale\'nin eşsiz beyaz travertenlerini gün doğumunda sıcak hava balonu ile keşfedin. UNESCO Dünya Mirası listesindeki bu muhteşem manzarayı gökyüzünden deneyimleyin.',
          shortDescription: 'Gün doğumunda balon turu',
          category: 'balloon',
          price: 8000,
          discountPrice: 6500,
          currency: 'TRY',
          duration: '1 saat uçuş + 3 saat toplam',
          location: 'Denizli, Pamukkale',
          meetingPoint: 'Otel transferi dahil',
          includes: ['Otel transferi', 'Kahvaltı', 'Şampanya', 'Uçuş sertifikası', 'Sigorta'],
          excludes: ['Video/Fotoğraf paketi'],
          maxParticipants: 16,
          isActive: true,
          isFeatured: true,
          order: 3
        }
      ];

      for (const activityData of activities) {
        await Activity.create(activityData);
        console.log(`✅ Aktivite oluşturuldu: ${activityData.name}`);
      }
    } else {
      console.log('ℹ️ Aktiviteler zaten mevcut');
    }

    // Varsayılan ayarlar
    const existingSettings = await Settings.findOne();
    if (!existingSettings) {
      await Settings.create({
        siteName: 'GoSky Turkey',
        heroTitle: 'Gökyüzüne Yeni Bir Bakış',
        heroSubtitle: 'Yamaç paraşütü, gyrocopter ve balon turları ile unutulmaz deneyimler',
        contactEmail: 'info@goskyturkey.com',
        phone: '+90 555 123 4567',
        whatsapp: '+90 555 123 4567',
        address: 'Fethiye, Muğla, Türkiye'
      });
      console.log('✅ Site ayarları oluşturuldu');
    } else {
      console.log('ℹ️ Site ayarları zaten mevcut');
    }

    console.log('\n🎉 Seed işlemi tamamlandı!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed hatası:', error.message);
    process.exit(1);
  }
};

seedData();
