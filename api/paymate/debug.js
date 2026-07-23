const crypto = require('crypto');
const https = require('https');
const dns = require('dns');
const { promisify } = require('util');
const { encryptRequest, decryptPayload } = require('../lib/paymate-crypto');
const { getPaymateConfig } = require('../lib/paymate-config');
const {
  extractPaymateMessage,
  extractPaymentUrl,
  isSuccessPayload,
  parsePayMateResponse,
} = require('../lib/paymate-client');

function httpsPostIPv4(urlStr, headers, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: { ...headers, 'Content-Length': Buffer.byteLength(body) },
      family: 4,
      timeout: 10000,
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        const connInfo = {
          localAddress: req.socket?.localAddress,
          localPort: req.socket?.localPort,
          remoteAddress: req.socket?.remoteAddress,
          remoteFamily: req.socket?.remoteFamily,
        };
        let parsed;
        try { parsed = JSON.parse(data); } catch { parsed = { raw: data.slice(0, 300) }; }
        resolve({ status: res.statusCode, headers: res.headers, body: parsed, connection: connInfo });
      });
    });
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function httpsGetIPv4(urlStr) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: 'GET',
      family: 4,
      timeout: 5000,
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        resolve({
          body: data.trim(),
          localAddress: req.socket?.localAddress,
          remoteAddress: req.socket?.remoteAddress,
        });
      });
    });
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    req.on('error', reject);
    req.end();
  });
}

function httpsPostMTLS(urlStr, headers, body, clientKey, clientCert) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: { ...headers, 'Content-Length': Buffer.byteLength(body) },
      family: 4,
      key: clientKey,
      cert: clientCert,
      timeout: 10000,
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let parsed;
        try { parsed = JSON.parse(data); } catch { parsed = { raw: data.slice(0, 300) }; }
        resolve({
          status: res.statusCode,
          body: parsed,
          connection: {
            localAddress: req.socket?.localAddress,
            remoteAddress: req.socket?.remoteAddress,
            authorized: req.socket?.authorized,
          },
        });
      });
    });
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

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

    // #region agent log — H1: Check IP via multiple services + https module
    const ipChecks = {};
    const ipServices = [
      { name: 'ipify_fetch', url: 'https://api.ipify.org?format=json', extract: (d) => d.ip },
      { name: 'ifconfig_fetch', url: 'https://ifconfig.me/ip', extract: (d) => d.trim() },
    ];
    for (const svc of ipServices) {
      try {
        const r = await fetch(svc.url, { signal: AbortSignal.timeout(5000) });
        const txt = await r.text();
        let data;
        try { data = JSON.parse(txt); } catch { data = txt; }
        ipChecks[svc.name] = { ip: typeof data === 'string' ? svc.extract(data) : svc.extract(data), method: 'fetch/undici' };
      } catch (err) {
        ipChecks[svc.name] = { error: err.message };
      }
    }
    try {
      const r = await httpsGetIPv4('https://api.ipify.org?format=text');
      ipChecks.ipify_https_ipv4 = { ip: r.body, localAddress: r.localAddress, method: 'https module (family:4)' };
    } catch (err) {
      ipChecks.ipify_https_ipv4 = { error: err.message };
    }
    try {
      const r = await httpsGetIPv4('https://ifconfig.me/ip');
      ipChecks.ifconfig_https_ipv4 = { ip: r.body, localAddress: r.localAddress, method: 'https module (family:4)' };
    } catch (err) {
      ipChecks.ifconfig_https_ipv4 = { error: err.message };
    }
    const allIps = [...new Set(Object.values(ipChecks).map((c) => c.ip).filter(Boolean))];
    const detectedIps = allIps;
    report.checks.outbound_ip = {
      ok: allIps.length === 1,
      all_detected_ips: allIps,
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

    // #region agent log — H6: Full DNS check (A + AAAA records) for paymate.in
    const resolve4 = promisify(dns.resolve4);
    const resolve6 = promisify(dns.resolve6);
    const dnsResults = {};
    try { dnsResults.A = await resolve4('paymate.in'); } catch (e) { dnsResults.A_error = e.message; }
    try { dnsResults.AAAA = await resolve6('paymate.in'); } catch (e) { dnsResults.AAAA_error = e.message; }
    report.checks.paymate_dns = {
      ...dnsResults,
      has_ipv6: Boolean(dnsResults.AAAA && dnsResults.AAAA.length > 0),
      hypothesis: 'H6: If paymate.in has AAAA records, Node.js may connect via IPv6',
    };
    // #endregion

    // #region agent log — H1/H6: Force IPv4 connection to PayMate
    const ipv4Headers = {
      'Content-Type': 'application/json',
      MerchantId: config.merchantId,
      TerminalId: config.terminalId,
      BusinessXpressID: config.businessXpressId,
    };
    try {
      const t0 = Date.now();
      const ipv4Result = await httpsPostIPv4(config.endpoint, ipv4Headers, jsonBody);
      report.forced_ipv4_call = {
        hypothesis: 'H1/H6: Force IPv4 (family:4) to ensure PayMate sees 217.21.90.91',
        duration_ms: Date.now() - t0,
        connection: ipv4Result.connection,
        http_status: ipv4Result.status,
        response_body: ipv4Result.body,
        status_code: ipv4Result.body?.StatusCode || null,
        description: ipv4Result.body?.Description || null,
        different_from_fetch: ipv4Result.body?.StatusCode !== '105',
      };
    } catch (err) {
      report.forced_ipv4_call = { error: err.message };
    }
    // #endregion

    // #region agent log — H7: Test mTLS (present partner cert as TLS client certificate)
    const fs = require('fs');
    const partnerCertPath = require('path').join(__dirname, '..', '..', 'certs', 'partner-public.cer');
    let partnerCertPem = null;
    try { partnerCertPem = fs.readFileSync(partnerCertPath, 'utf8'); } catch { /* not deployed */ }

    if (partnerCertPem) {
      try {
        const t0 = Date.now();
        const mtlsResult = await httpsPostMTLS(config.endpoint, ipv4Headers, jsonBody, config.partnerPrivateKey, partnerCertPem);
        report.mtls_call = {
          hypothesis: 'H7: mTLS — present partner cert as TLS client certificate',
          duration_ms: Date.now() - t0,
          connection: mtlsResult.connection,
          http_status: mtlsResult.status,
          response_body: mtlsResult.body,
          status_code: mtlsResult.body?.StatusCode || null,
          description: mtlsResult.body?.Description || null,
          different_from_normal: mtlsResult.body?.StatusCode !== '105',
        };
      } catch (err) {
        report.mtls_call = {
          hypothesis: 'H7: mTLS — present partner cert as TLS client certificate',
          error: err.message,
          error_code: err.code,
        };
      }
    } else {
      report.mtls_call = { skipped: true, reason: 'partner-public.cer not found at ' + partnerCertPath };
    }
    // #endregion

    // #region agent log — H8: Check PayMate cert validity
    try {
      const payCert = new crypto.X509Certificate(config.paymatePublicCert);
      report.checks.paymate_cert_info = {
        subject: payCert.subject,
        issuer: payCert.issuer,
        validFrom: payCert.validFrom,
        validTo: payCert.validTo,
        expired: new Date(payCert.validTo) < new Date(),
        days_remaining: Math.floor((new Date(payCert.validTo) - new Date()) / 86400000),
      };
    } catch (err) {
      report.checks.paymate_cert_info = { error: err.message };
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
    const ipv4Different = report.forced_ipv4_call?.different_from_fetch;

    if (ipv4Different) {
      report.interpretation.push(
        `BREAKTHROUGH: Forcing IPv4 got StatusCode ${report.forced_ipv4_call.status_code} instead of 105! The issue is IPv6. Fix: force all PayMate calls to use IPv4.`
      );
    }

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
