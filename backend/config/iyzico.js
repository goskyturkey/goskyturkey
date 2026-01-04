const Iyzipay = require('iyzipay');

// iyzico API konfigürasyonu
const iyzipay = new Iyzipay({
    apiKey: process.env.IYZICO_API_KEY || 'sandbox-apikey',
    secretKey: process.env.IYZICO_SECRET_KEY || 'sandbox-secretkey',
    uri: process.env.IYZICO_URI || 'https://sandbox-api.iyzipay.com'
});

module.exports = iyzipay;
