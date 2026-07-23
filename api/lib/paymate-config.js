const fs = require('fs');
const path = require('path');

function normalizePem(value) {
  if (!value) return '';
  return value.replace(/\\n/g, '\n').trim();
}

function resolveExistingPath(candidates) {
  const seen = new Set();
  for (const candidate of candidates) {
    if (!candidate || seen.has(candidate)) continue;
    seen.add(candidate);
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

function loadPem({ label, inlineEnv, pathEnv, defaultRelativePaths, appRoot }) {
  const inline = normalizePem(inlineEnv);
  if (inline) {
    return inline;
  }

  const candidates = [];
  if (pathEnv) {
    candidates.push(pathEnv);
    if (!path.isAbsolute(pathEnv)) {
      candidates.push(path.join(process.cwd(), pathEnv));
      candidates.push(path.join(appRoot, pathEnv));
    }
  }

  for (const relativePath of defaultRelativePaths) {
    candidates.push(path.join(appRoot, relativePath));
    candidates.push(path.join(process.cwd(), relativePath));
  }

  const resolvedPath = resolveExistingPath(candidates);
  if (!resolvedPath) {
    throw new Error(
      `${label} not found. Upload the file or set ${label} env content. Tried: ${[...new Set(candidates)].join(' | ')} | cwd=${process.cwd()} | appRoot=${appRoot}`
    );
  }

  return fs.readFileSync(resolvedPath, 'utf8');
}

function getPaymateConfig() {
  const appRoot = path.join(__dirname, '..', '..');
  const merchantId = process.env.PAYMATE_MERCHANT_ID;
  const terminalId = process.env.PAYMATE_TERMINAL_ID;
  const businessXpressId = process.env.PAYMATE_BUSINESS_XPRESS_ID;
  const iv = process.env.PAYMATE_IV || '54327CD65487ECAB';
  const endpoint =
    process.env.PAYMATE_ENDPOINT ||
    'https://paymate.in/PaymatePartnerStack/api/v2/CollectPayments';
  const siteUrl = (process.env.SITE_URL || 'https://fominomart.in').replace(/\/$/, '');

  if (!merchantId || !terminalId || !businessXpressId) {
    throw new Error(
      'PayMate not configured. Set PAYMATE_MERCHANT_ID, PAYMATE_TERMINAL_ID, and PAYMATE_BUSINESS_XPRESS_ID.'
    );
  }

  const paymatePublicCert = loadPem({
    label: 'PayMate public certificate',
    inlineEnv: process.env.PAYMATE_PUBLIC_CERT,
    pathEnv: process.env.PAYMATE_PUBLIC_CERT_PATH,
    defaultRelativePaths: ['certs/paymate-public.cer'],
    appRoot,
  });

  const partnerPrivateKey = loadPem({
    label: 'Partner private key',
    inlineEnv: process.env.PAYMATE_PARTNER_PRIVATE_KEY,
    pathEnv: process.env.PAYMATE_PARTNER_PRIVATE_KEY_PATH,
    defaultRelativePaths: ['ssl-pg-partner/partner_private.pem'],
    appRoot,
  });

  return {
    merchantId,
    terminalId,
    businessXpressId,
    iv,
    endpoint,
    siteUrl,
    paymatePublicCert,
    partnerPrivateKey,
    companyName: process.env.PAYMATE_COMPANY_NAME || 'Fomino Product Hub Pvt Ltd',
    referenceCode: process.env.PAYMATE_REFERENCE_CODE || 'FOMINO01',
  };
}

module.exports = { getPaymateConfig };
