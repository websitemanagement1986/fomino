const { encryptRequest, decryptPayload } = require('./paymate-crypto');
const { getPaymateConfig } = require('./paymate-config');

function extractPaymentUrl(payload) {
  const candidates = [
    payload?.Response?.PaymentURL,
    payload?.Response?.PaymentUrl,
    payload?.DetailedSummary?.PaymentURL,
    payload?.DetailedSummary?.PaymentUrl,
    payload?.PaymentURL,
    payload?.PaymentUrl,
    payload?.CheckoutURL,
    payload?.checkoutUrl,
  ];
  return candidates.find((value) => typeof value === 'string' && value.length > 0) || null;
}

function isSuccessPayload(payload) {
  const code = String(
    payload?.StatusCode || payload?.ErrorCode || payload?.statusCode || payload?.errorCode || ''
  );
  if (code === '000' || code === '0') return true;
  const description = String(payload?.Description || payload?.ErrorDescription || '').toLowerCase();
  return description.includes('success');
}

async function callPayMate(plainPayload) {
  const config = getPaymateConfig();
  const encryptedBody = encryptRequest(plainPayload, config.paymatePublicCert, config.iv);

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
  let encryptedResponse;
  try {
    encryptedResponse = JSON.parse(rawText);
  } catch {
    throw new Error(`PayMate returned non-JSON response (${response.status})`);
  }

  if (!response.ok && !encryptedResponse.EncryptedData) {
    throw new Error(encryptedResponse.message || encryptedResponse.error || `PayMate HTTP ${response.status}`);
  }

  const decrypted = decryptPayload(encryptedResponse, config.partnerPrivateKey, config.iv);
  return { decrypted, config };
}

module.exports = {
  callPayMate,
  extractPaymentUrl,
  isSuccessPayload,
};
