const crypto = require('crypto');
const { encryptRequest, decryptPayload } = require('../lib/paymate-crypto');
const { getPaymateConfig } = require('../lib/paymate-config');
const {
  extractPaymateMessage,
  extractPaymentUrl,
  isSuccessPayload,
  parsePayMateResponse,
} = require('../lib/paymate-client');

function maskId(value) {
  if (!value || value.length < 8) return value;
  return `${value.slice(0, 8)}...${value.slice(-4)}`;
}

function buildSamplePayload(orderId) {
  return {
    CollectionDetails: [
      {
        TransactionDetails: {
          OrderID: orderId,
          CompanyName: 'Fomino Product Hub Pvt Ltd',
          ReferenceCode: 'FOMINO01',
          ContactXpressID: '',
          ReceipentMobileNo: '9876543210',
          RecipentEmailAddress: 'debug@fominomart.in',
          UDF1: [],
          UDF2: [],
          UDF3: [],
          Remarks: 'PayMate connectivity test',
          ReturnURL: 'https://fominomart.in/paymate-return.html?orderId=' + orderId,
        },
        INVOICE: {
          InvoiceNumber: orderId,
          InvoiceStartDate: '',
          InvoiceTerm: '',
          InvoiceAmount: '1',
          GSTType: '',
          GST: '',
        },
        PaymentMethod: {
          PaymentMode: 'UPI/CreditCard/DebitCard/NetBanking',
          PaymentType: 'VPA/QRCode/Card/Banking',
        },
        SplitMDR: {
          BuyerCharges: '0',
          SupplierCharges: '100',
        },
      },
    ],
  };
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const debugKey = process.env.PAYMATE_DEBUG_KEY;
  if (debugKey && req.query.key !== debugKey) {
    return res.status(403).json({ error: 'Invalid debug key' });
  }

  const report = {
    checked_at: new Date().toISOString(),
    server: {
      cwd: process.cwd(),
      node_version: process.version,
    },
    checks: {},
    paymate_call: null,
    interpretation: [],
  };

  try {
    const config = getPaymateConfig();
    report.checks.config = {
      ok: true,
      endpoint: config.endpoint,
      site_url: config.siteUrl,
      business_xpress_id: config.businessXpressId,
      merchant_id: maskId(config.merchantId),
      terminal_id: maskId(config.terminalId),
      iv_length: config.iv.length,
      paymate_public_cert_loaded: config.paymatePublicCert.includes('BEGIN CERTIFICATE'),
      partner_private_key_loaded: config.partnerPrivateKey.includes('BEGIN'),
      partner_key_source: config.partnerPrivateKeySource,
      partner_key_b64_length: process.env.PAYMATE_PARTNER_PRIVATE_KEY_B64
        ? process.env.PAYMATE_PARTNER_PRIVATE_KEY_B64.replace(/\s+/g, '').length
        : null,
    };

    const partnerPublic = crypto.createPublicKey(config.partnerPrivateKey);
    const testKey = 'AES256BITSKEYFORENCRYPTIONOFDATA';
    const encKey = crypto
      .publicEncrypt(
        { key: partnerPublic, padding: crypto.constants.RSA_PKCS1_PADDING },
        Buffer.from(testKey, 'utf8')
      )
      .toString('base64');
    const decKey = crypto
      .privateDecrypt(
        { key: config.partnerPrivateKey, padding: crypto.constants.RSA_PKCS1_PADDING },
        Buffer.from(encKey, 'base64')
      )
      .toString('utf8');
    report.checks.partner_key_pair = { ok: decKey === testKey };

    const paymateEncrypt = encryptRequest({ ping: true }, config.paymatePublicCert, config.iv);
    report.checks.paymate_request_encryption = {
      ok: Boolean(paymateEncrypt.EncryptedRandomKey && paymateEncrypt.EncryptedData),
      encrypted_data_length: paymateEncrypt.EncryptedData?.length || 0,
    };

    const ipResponse = await fetch('https://api.ipify.org?format=json');
    const ipData = await ipResponse.json();
    report.checks.outbound_ip = { ok: true, ip: ipData.ip };

    const orderId = `DBG${Date.now()}`.slice(0, 20);
    const payload = buildSamplePayload(orderId);
    const encryptedBody = encryptRequest(payload, config.paymatePublicCert, config.iv);

    const started = Date.now();
    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        MerchantId: config.merchantId,
        TerminalId: config.terminalId,
        BusinessXpressID: config.businessXpressId,
      },
      body: JSON.stringify(encryptedBody),
    });
    const rawText = await response.text();
    let rawJson;
    try {
      rawJson = JSON.parse(rawText);
    } catch {
      rawJson = { parse_error: true, raw_preview: rawText.slice(0, 300) };
    }

    let parsed = null;
    try {
      parsed = parsePayMateResponse(rawJson, config);
    } catch (err) {
      parsed = { parse_error: err.message };
    }

    report.paymate_call = {
      duration_ms: Date.now() - started,
      http_status: response.status,
      request_headers: {
        MerchantId: maskId(config.merchantId),
        TerminalId: maskId(config.terminalId),
        BusinessXpressID: config.businessXpressId,
      },
      sample_order_id: orderId,
      raw_response: rawJson,
      parsed_response: parsed,
      status_code: parsed?.StatusCode || rawJson?.StatusCode || null,
      description: extractPaymateMessage(parsed) || extractPaymateMessage(rawJson),
      payment_url: extractPaymentUrl(parsed),
      success: isSuccessPayload(parsed),
    };

    if (report.paymate_call.status_code === '105') {
      report.interpretation.push(
        'PayMate StatusCode 105 = Request from Invalid Source. This is almost always IP whitelist or wrong merchant/environment on PayMate side.'
      );
      report.interpretation.push(
        `Ask PayMate to whitelist outbound IP ${ipData.ip} for BusinessXpressID ${config.businessXpressId} on PRODUCTION.`
      );
    } else if (report.paymate_call.success) {
      report.interpretation.push('PayMate API call succeeded from our side. Checkout should work.');
    } else if (report.paymate_call.description) {
      report.interpretation.push(`PayMate returned: ${report.paymate_call.description}`);
    }

    report.checks.overall_ok = report.paymate_call.success === true;

    return res.status(200).json(report);
  } catch (err) {
    report.checks.overall_ok = false;
    report.error = err.message;
    report.interpretation.push('Local configuration or crypto setup failed before/during PayMate call.');
    if (
      err.message.includes('bad base64 decode') ||
      err.message.includes('no start line')
    ) {
      report.interpretation.push(
        'Hostinger often corrupts multi-line PEM in PAYMATE_PARTNER_PRIVATE_KEY. ' +
          'Delete that env var, run `node scripts/print-paymate-private-key-env.js` locally, ' +
          'and set PAYMATE_PARTNER_PRIVATE_KEY_B64 to the single base64 line instead.'
      );
    }
    return res.status(500).json(report);
  }
};
