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

    // #region agent log — H1: Check IP via multiple services
    const ipChecks = {};
    const ipServices = [
      { name: 'ipify', url: 'https://api.ipify.org?format=json', extract: (d) => d.ip },
      { name: 'ifconfig', url: 'https://ifconfig.me/ip', extract: (d) => d.trim() },
      { name: 'httpbin', url: 'https://httpbin.org/ip', extract: (d) => d.origin },
    ];
    for (const svc of ipServices) {
      try {
        const r = await fetch(svc.url, { signal: AbortSignal.timeout(5000) });
        const txt = await r.text();
        let data;
        try { data = JSON.parse(txt); } catch { data = txt; }
        ipChecks[svc.name] = { ip: typeof data === 'string' ? svc.extract(data) : svc.extract(data), raw: typeof data === 'string' ? data.trim().slice(0, 50) : data };
      } catch (err) {
        ipChecks[svc.name] = { error: err.message };
      }
    }
    const detectedIps = [...new Set(Object.values(ipChecks).map((c) => c.ip).filter(Boolean))];
    report.checks.outbound_ip = {
      ok: detectedIps.length === 1,
      detected_ips: detectedIps,
      services: ipChecks,
      consistent: detectedIps.length === 1,
      hypothesis: 'H1: If IPs differ, PayMate may see a different IP than ipify reports',
    };
    // #endregion

    // #region agent log — H2-H5: Try multiple request variations
    const orderId = `DBG${Date.now()}`.slice(0, 20);
    const payload = buildSamplePayload(orderId);
    const encryptedBody = encryptRequest(payload, config.paymatePublicCert, config.iv);
    const jsonBody = JSON.stringify(encryptedBody);

    const variations = [
      {
        id: 'original',
        hypothesis: 'H2: Current header casing',
        url: config.endpoint,
        headers: {
          'Content-Type': 'application/json',
          MerchantId: config.merchantId,
          TerminalId: config.terminalId,
          BusinessXpressID: config.businessXpressId,
        },
      },
      {
        id: 'lowercase_bxid',
        hypothesis: 'H2: BusinessXpressId instead of BusinessXpressID',
        url: config.endpoint,
        headers: {
          'Content-Type': 'application/json',
          MerchantId: config.merchantId,
          TerminalId: config.terminalId,
          BusinessXpressId: config.businessXpressId,
        },
      },
      {
        id: 'all_lowercase',
        hypothesis: 'H2: All lowercase header names',
        url: config.endpoint,
        headers: {
          'content-type': 'application/json',
          merchantid: config.merchantId,
          terminalid: config.terminalId,
          businessxpressid: config.businessXpressId,
        },
      },
      {
        id: 'with_useragent',
        hypothesis: 'H3: Adding User-Agent header',
        url: config.endpoint,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'FominoPayMate/1.0',
          MerchantId: config.merchantId,
          TerminalId: config.terminalId,
          BusinessXpressID: config.businessXpressId,
        },
      },
      {
        id: 'uat_endpoint',
        hypothesis: 'H4: Try UAT/sandbox endpoint',
        url: config.endpoint.replace('paymate.in', 'uat.paymate.in'),
        headers: {
          'Content-Type': 'application/json',
          MerchantId: config.merchantId,
          TerminalId: config.terminalId,
          BusinessXpressID: config.businessXpressId,
        },
      },
      {
        id: 'sandbox_endpoint',
        hypothesis: 'H4: Try sandbox endpoint',
        url: config.endpoint.replace('paymate.in', 'sandbox.paymate.in'),
        headers: {
          'Content-Type': 'application/json',
          MerchantId: config.merchantId,
          TerminalId: config.terminalId,
          BusinessXpressID: config.businessXpressId,
        },
      },
    ];

    report.variation_results = [];

    for (const v of variations) {
      const t0 = Date.now();
      try {
        const r = await fetch(v.url, {
          method: 'POST',
          headers: v.headers,
          body: jsonBody,
          signal: AbortSignal.timeout(10000),
        });
        const txt = await r.text();
        let body;
        try { body = JSON.parse(txt); } catch { body = { raw_preview: txt.slice(0, 300) }; }
        report.variation_results.push({
          id: v.id,
          hypothesis: v.hypothesis,
          url: v.url,
          headers_sent: v.headers,
          duration_ms: Date.now() - t0,
          http_status: r.status,
          response_body: body,
          status_code: body?.StatusCode || null,
          changed: body?.StatusCode !== '105',
        });
      } catch (err) {
        report.variation_results.push({
          id: v.id,
          hypothesis: v.hypothesis,
          url: v.url,
          error: err.message,
          duration_ms: Date.now() - t0,
        });
      }
    }
    // #endregion

    // #region agent log — H5: Try DNS resolution of paymate.in
    try {
      const dns = require('dns');
      const { promisify } = require('util');
      const resolve4 = promisify(dns.resolve4);
      const paymateIps = await resolve4('paymate.in');
      report.checks.paymate_dns = { ok: true, ips: paymateIps };
    } catch (err) {
      report.checks.paymate_dns = { ok: false, error: err.message };
    }
    // #endregion

    const primaryResult = report.variation_results.find((v) => v.id === 'original') || {};
    report.paymate_call = {
      duration_ms: primaryResult.duration_ms,
      request: {
        method: 'POST',
        url: config.endpoint,
        headers: primaryResult.headers_sent,
        body: encryptedBody,
        plain_text_payload: payload,
      },
      response: {
        http_status: primaryResult.http_status,
        body: primaryResult.response_body,
      },
      sample_order_id: orderId,
      status_code: primaryResult.status_code,
      description: primaryResult.response_body?.Description || null,
      success: primaryResult.status_code === '100',
    };

    const anyDifferent = report.variation_results.filter((v) => v.changed);
    if (anyDifferent.length > 0) {
      report.interpretation.push(
        `BREAKTHROUGH: ${anyDifferent.length} variation(s) got a DIFFERENT response: ${anyDifferent.map((v) => v.id + '=' + v.status_code).join(', ')}`
      );
    }

    if (!report.checks.outbound_ip.consistent) {
      report.interpretation.push(
        `H1 ALERT: Multiple outbound IPs detected: ${detectedIps.join(', ')}. PayMate may see a different IP.`
      );
    } else {
      report.interpretation.push(
        `H1: Outbound IP consistent across services: ${detectedIps[0]}`
      );
    }

    if (primaryResult.status_code === '105' && anyDifferent.length === 0) {
      report.interpretation.push(
        'All header/endpoint variations still got 105. Issue is likely IP whitelist or account activation on PayMate side.'
      );
    }

    report.checks.overall_ok = primaryResult.status_code === '100';

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
