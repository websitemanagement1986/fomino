const { validateCart } = require('../lib/products');
const { callPayMate, extractPaymentUrl, isSuccessPayload } = require('../lib/paymate-client');
const { getPaymateConfig } = require('../lib/paymate-config');
const { savePendingOrder } = require('../lib/paymate-orders');

function buildOrderId() {
  return `FOM${Date.now()}`.slice(0, 20);
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { cart, customer } = req.body || {};
    if (!customer?.name || !customer?.email || !customer?.phone) {
      return res.status(400).json({ error: 'Customer details are required' });
    }

    const { items, subtotal, deliveryCharge, total } = validateCart(cart);
    const config = getPaymateConfig();
    const orderId = buildOrderId();
    const returnUrl = `${config.siteUrl}/paymate-return.html?orderId=${encodeURIComponent(orderId)}`;

    const payload = {
      CollectionDetails: [
        {
          TransactionDetails: {
            OrderID: orderId,
            CompanyName: config.companyName,
            ReferenceCode: config.referenceCode,
            ContactXpressID: '',
            ReceipentMobileNo: customer.phone.replace(/\D/g, '').slice(-10),
            RecipentEmailAddress: customer.email,
            UDF1: [],
            UDF2: [],
            UDF3: [],
            Remarks: 'Fomino grocery order',
            ReturnURL: returnUrl,
          },
          INVOICE: {
            InvoiceNumber: orderId,
            InvoiceStartDate: '',
            InvoiceTerm: '',
            InvoiceAmount: String(total),
            GSTType: '',
            GST: '',
          },
          PaymentMethod: {
            PaymentMode: 'ALL',
            PaymentType: 'Checkout',
          },
          SplitMDR: {
            BuyerCharges: '0',
            SupplierCharges: String(total),
          },
        },
      ],
    };

    savePendingOrder(orderId, {
      customer,
      items,
      subtotal,
      deliveryCharge,
      total,
      returnUrl,
    });

    const { decrypted } = await callPayMate(payload);
    if (!isSuccessPayload(decrypted)) {
      const message =
        decrypted?.Description ||
        decrypted?.ErrorDescription ||
        decrypted?.DetailedSummary?.Message ||
        'PayMate rejected the payment request';
      return res.status(502).json({ error: message, details: decrypted });
    }

    const paymentUrl = extractPaymentUrl(decrypted);
    if (!paymentUrl) {
      return res.status(502).json({
        error: 'PayMate did not return a payment URL',
        details: decrypted,
      });
    }

    return res.status(200).json({
      order_id: orderId,
      payment_url: paymentUrl,
      transaction_ref:
        decrypted?.Response?.TransactionRefNo ||
        decrypted?.DetailedSummary?.TransactionRefNo ||
        null,
      amount: total,
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};
