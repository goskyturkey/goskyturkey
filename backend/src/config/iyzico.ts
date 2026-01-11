import Iyzipay from 'iyzipay';

// Only initialize Iyzipay if API keys are configured
const apiKey = process.env.IYZICO_API_KEY;
const secretKey = process.env.IYZICO_SECRET_KEY;

let iyzipay: Iyzipay | null = null;

if (apiKey && secretKey) {
    iyzipay = new Iyzipay({
        apiKey,
        secretKey,
        uri: process.env.IYZICO_URI || 'https://sandbox-api.iyzipay.com'
    });
} else {
    console.warn('⚠️ IYZICO_API_KEY or IYZICO_SECRET_KEY not configured. Payment functionality disabled.');
}

export default iyzipay;
