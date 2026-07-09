const { validateCart } = require('./lib/products');
const { sendOrderEmails } = require('./lib/email');

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
    if (!customer?.address || !customer?.city || !customer?.state || !customer?.pincode) {
      return res.status(400).json({ error: 'Delivery address is required for COD orders' });
    }

    const { items, total } = validateCart(cart);
    const transactionId = `FOM-COD-${Date.now()}`;

    await sendOrderEmails({
      transactionId,
      orderId: transactionId,
      customer,
      items,
      total,
      paymentMethod: 'cod',
    });

    return res.status(200).json({
      success: true,
      transaction_id: transactionId,
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};
