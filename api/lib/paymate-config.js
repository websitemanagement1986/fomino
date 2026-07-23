const fs = require('fs');
const path = require('path');

function readCert(filePath) {
  if (!filePath || !fs.existsSync(filePath)) {
    throw new Error(`Certificate file not found: ${filePath}`);
  }
  return fs.readFileSync(filePath, 'utf8');
}

function getPaymateConfig() {
  const root = path.join(__dirname, '..', '..');
  const merchantId = process.env.PAYMATE_MERCHANT_ID;
  const terminalId = process.env.PAYMATE_TERMINAL_ID;
  const businessXpressId = process.env.PAYMATE_BUSINESS_XPRESS_ID;
  const iv = process.env.PAYMATE_IV || '54327CD65487ECAB';
  const endpoint =
    process.env.PAYMATE_ENDPOINT ||
    'https://paymate.in/PaymatePartnerStack/api/v2/CollectPayments';
  const siteUrl = (process.env.SITE_URL || 'https://fominomart.in').replace(/\/$/, '');

  const paymatePublicCertPath =
    process.env.PAYMATE_PUBLIC_CERT_PATH || path.join(root, 'certs', 'paymate-public.cer');
  const partnerPrivateKeyPath =
    process.env.PAYMATE_PARTNER_PRIVATE_KEY_PATH ||
    path.join(root, 'ssl-pg-partner', 'partner_private.pem');

  if (!merchantId || !terminalId || !businessXpressId) {
    throw new Error(
      'PayMate not configured. Set PAYMATE_MERCHANT_ID, PAYMATE_TERMINAL_ID, and PAYMATE_BUSINESS_XPRESS_ID.'
    );
  }

  return {
    merchantId,
    terminalId,
    businessXpressId,
    iv,
    endpoint,
    siteUrl,
    paymatePublicCert: readCert(paymatePublicCertPath),
    partnerPrivateKey: readCert(partnerPrivateKeyPath),
    companyName: process.env.PAYMATE_COMPANY_NAME || 'Fomino Product Hub Pvt Ltd',
    referenceCode: process.env.PAYMATE_REFERENCE_CODE || 'FOMINO01',
  };
}

module.exports = { getPaymateConfig };
