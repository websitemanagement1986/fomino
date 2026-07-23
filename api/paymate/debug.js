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
const { resolvePaymateMethod } = require('../lib/paymate-payment-methods');

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

function analyzePaymateBody(body, config) {
  if (!body || typeof body !== 'object') {
    return { raw: body, status_code: null, success: false };
  }

  if (body.EncryptedData || body.encryptedData) {
    const parsed = parsePayMateResponse(body, config);
    return {
      encrypted: true,
      parsed,
      status_code: parsed?.StatusCode || null,
      description: extractPaymateMessage(parsed),
      payment_url: extractPaymentUrl(parsed),
      success: isSuccessPayload(parsed),
    };
  }

  return {
    encrypted: false,
    parsed: body,
    status_code: body?.StatusCode || null,
    description: extractPaymateMessage(body),
    payment_url: extractPaymentUrl(body),
    success: isSuccessPayload(body),
  };
}

function maskId(value) {
  if (!value || value.length < 8) return value;
  return `${value.slice(0, 8)}...${value.slice(-4)}`;
}

function buildSamplePayload(orderId, methodKey = 'upi') {
  const paymateMethod = resolvePaymateMethod(methodKey);
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
          PaymentMode: paymateMethod.PaymentMode,
          PaymentType: paymateMethod.PaymentType,
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

    const baseHeaders = {
      'Content-Type': 'application/json',
      MerchantId: config.merchantId,
      TerminalId: config.terminalId,
      BusinessXpressID: config.businessXpressId,
    };

    const variations = [
      {
        id: 'original',
        hypothesis: 'Baseline: current headers',
        url: config.endpoint,
        headers: { ...baseHeaders },
      },
      {
        id: 'with_origin',
        hypothesis: 'H10/H11: Add Origin header (domain validation)',
        url: config.endpoint,
        headers: { ...baseHeaders, Origin: config.siteUrl },
      },
      {
        id: 'with_referer',
        hypothesis: 'H11: Add Referer header',
        url: config.endpoint,
        headers: { ...baseHeaders, Referer: config.siteUrl + '/' },
      },
      {
        id: 'with_origin_and_referer',
        hypothesis: 'H11: Both Origin + Referer',
        url: config.endpoint,
        headers: {
          ...baseHeaders,
          Origin: config.siteUrl,
          Referer: config.siteUrl + '/checkout.html',
          'User-Agent': 'FominoPayMate/1.0',
        },
      },
      {
        id: 'with_host',
        hypothesis: 'H10: Explicit Host header matching PayMate domain',
        url: config.endpoint,
        headers: { ...baseHeaders, Host: 'paymate.in' },
      },
      {
        id: 'uat_co_in',
        hypothesis: 'H4b: Try uat.paymate.co.in (from PayMate docs)',
        url: 'https://uat.paymate.co.in/PaymatePartnerStack/api/v2/CollectPayments',
        headers: { ...baseHeaders },
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
        const analyzed = analyzePaymateBody(body, config);
        report.variation_results.push({
          id: v.id,
          hypothesis: v.hypothesis,
          url: v.url,
          headers_sent: v.headers,
          duration_ms: Date.now() - t0,
          http_status: r.status,
          response_body: body,
          parsed_response: analyzed.parsed,
          encrypted_response: analyzed.encrypted,
          status_code: analyzed.status_code,
          description: analyzed.description,
          payment_url: analyzed.payment_url,
          success: analyzed.success,
          changed: analyzed.status_code !== '105',
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
      const ipv4Analyzed = analyzePaymateBody(ipv4Result.body, config);
      report.forced_ipv4_call = {
        hypothesis: 'H1/H6: Force IPv4 (family:4) to ensure PayMate sees 217.21.90.91',
        duration_ms: Date.now() - t0,
        connection: ipv4Result.connection,
        http_status: ipv4Result.status,
        response_body: ipv4Result.body,
        parsed_response: ipv4Analyzed.parsed,
        status_code: ipv4Analyzed.status_code,
        description: ipv4Analyzed.description,
        payment_url: ipv4Analyzed.payment_url,
        success: ipv4Analyzed.success,
        different_from_fetch: ipv4Analyzed.status_code !== '105',
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
        const mtlsAnalyzed = analyzePaymateBody(mtlsResult.body, config);
        report.mtls_call = {
          hypothesis: 'H7: mTLS — present partner cert as TLS client certificate',
          duration_ms: Date.now() - t0,
          connection: mtlsResult.connection,
          http_status: mtlsResult.status,
          response_body: mtlsResult.body,
          parsed_response: mtlsAnalyzed.parsed,
          status_code: mtlsAnalyzed.status_code,
          description: mtlsAnalyzed.description,
          payment_url: mtlsAnalyzed.payment_url,
          success: mtlsAnalyzed.success,
          different_from_normal: mtlsAnalyzed.status_code !== '105',
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
        parsed: primaryResult.parsed_response || null,
      },
      sample_order_id: orderId,
      status_code: primaryResult.status_code,
      description: primaryResult.description || null,
      payment_url: primaryResult.payment_url || null,
      success: Boolean(primaryResult.success),
    };

    report.interpretation = [];

    if (primaryResult.encrypted_response && primaryResult.status_code !== '105') {
      if (primaryResult.success) {
        report.interpretation.push(
          'PayMate connection is working. Encrypted response decrypted successfully and request was accepted.'
        );
        if (primaryResult.payment_url) {
          report.interpretation.push(`Payment URL received: ${primaryResult.payment_url}`);
        }
      } else if (primaryResult.status_code === '178') {
        report.interpretation.push(
          'PayMate accepted the connection (105 is fixed) but rejected request fields: Invalid Payment Mode. Ask PayMate to enable Checkout payment modes (UPI/Card/NetBanking) for merchant KIJY000002.'
        );
        report.interpretation.push(
          `Detail: ${primaryResult.parsed_response?.DetailedSummary?.[0]?.StatusMessage || primaryResult.description}`
        );
      } else {
        report.interpretation.push(
          `PayMate returned StatusCode ${primaryResult.status_code}: ${primaryResult.description || 'see parsed_response'}`
        );
      }
    } else if (primaryResult.status_code === '105') {
      report.interpretation.push(
        'PayMate StatusCode 105 = Request from Invalid Source. IP whitelist or account activation issue on PayMate side.'
      );
    }

    const anyDifferent = report.variation_results.filter((v) => v.changed);
    const ipv4Different = report.forced_ipv4_call?.different_from_fetch;

    if (ipv4Different && primaryResult.status_code === '105') {
      report.interpretation.push(
        `BREAKTHROUGH: Forcing IPv4 got StatusCode ${report.forced_ipv4_call.status_code} instead of 105! The issue is IPv6. Fix: force all PayMate calls to use IPv4.`
      );
    }

    if (anyDifferent.length > 0 && primaryResult.status_code === '105') {
      report.interpretation.push(
        `${anyDifferent.length} variation(s) got a different response from 105: ${anyDifferent.map((v) => v.id + '=' + v.status_code).join(', ')}`
      );
    }

    if (!report.checks.outbound_ip.consistent) {
      report.interpretation.push(
        `Outbound IPv4 to PayMate is ${ipChecks.ipify_https_ipv4?.ip || detectedIps[0]}. IPv6 also present on server but PayMate uses IPv4.`
      );
    }

    if (primaryResult.status_code === '105' && anyDifferent.length === 0) {
      report.interpretation.push(
        'All variations still got 105. Issue is likely IP whitelist or account activation on PayMate side.'
      );
    }

    report.checks.overall_ok = Boolean(primaryResult.success);

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
