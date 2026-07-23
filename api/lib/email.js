async function sendViaResend({ to, subject, html }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.FROM_EMAIL || 'orders@fominomart.in';

  if (!apiKey) {
    console.log(`[EMAIL SKIPPED - no RESEND_API_KEY] To: ${to}, Subject: ${subject}`);
    return { skipped: true };
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ from: `Fomino <${from}>`, to, subject, html }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to send email');
  }
  return res.json();
}

function buildOrderHtml({ transactionId, orderId, customer, items, subtotal, deliveryCharge, total, paymentMethod, paymentProvider, isAdmin }) {
  const itemRows = items
    .map((i) => `<tr><td>${i.name}</td><td>${i.qty}</td><td>₹${i.lineTotal.toLocaleString('en-IN')}</td></tr>`)
    .join('');

  const deliveryRow = deliveryCharge
    ? `<tr><td colspan="2" style="padding:8px;">Delivery</td><td style="padding:8px;text-align:right;">₹${deliveryCharge.toLocaleString('en-IN')}</td></tr>`
    : `<tr><td colspan="2" style="padding:8px;">Delivery</td><td style="padding:8px;text-align:right;">FREE</td></tr>`;

  const payLabel = paymentMethod === 'cod'
    ? 'Cash on Delivery (Pay on delivery)'
    : paymentProvider === 'paymate'
      ? 'Paid Online via PayMate'
      : 'Paid Online';
  const title = isAdmin ? 'New Grocery Order' : 'Order Confirmation — Fomino';
  const greeting = isAdmin
    ? `<p>A new order has been placed on Fomino.</p>`
    : `<p>Dear ${customer.name},</p><p>Thank you for ordering from Fomino! ${paymentMethod === 'cod' ? 'Please keep cash ready for delivery.' : 'Your payment was successful.'}</p>`;

  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <h2 style="color:#689f38;">${title}</h2>
      ${greeting}
      <p><strong>Order ID:</strong> ${transactionId}</p>
      <p><strong>Payment:</strong> ${payLabel}</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <thead><tr style="background:#33691e;color:#fff;">
          <th style="padding:8px;text-align:left;">Product</th>
          <th style="padding:8px;">Qty</th>
          <th style="padding:8px;text-align:right;">Amount</th>
        </tr></thead>
        <tbody>${itemRows}</tbody>
        <tfoot>
          <tr><td colspan="2" style="padding:8px;">Subtotal</td><td style="padding:8px;text-align:right;">₹${subtotal.toLocaleString('en-IN')}</td></tr>
          ${deliveryRow}
          <tr><td colspan="2" style="padding:8px;font-weight:bold;">Total</td>
          <td style="padding:8px;text-align:right;font-weight:bold;">₹${total.toLocaleString('en-IN')}</td></tr>
        </tfoot>
      </table>
      <p><strong>Customer:</strong> ${customer.name}<br>
         <strong>Email:</strong> ${customer.email}<br>
         <strong>Phone:</strong> ${customer.phone}<br>
         <strong>Address:</strong> ${customer.address}, ${customer.city}, ${customer.state} - ${customer.pincode}</p>
      <p style="color:#64748b;font-size:12px;">Fomino Product Hub Pvt Ltd | Office no O-1231, Gaur City Centre, Sec-4, Greater Noida West, UP 201318 | +91 7840819741</p>
    </div>`;
}

async function sendOrderEmails({ transactionId, orderId, customer, items, subtotal, deliveryCharge, total, paymentMethod = 'online', paymentProvider = 'paymate' }) {
  const adminEmail = process.env.ADMIN_EMAIL;
  const buyerHtml = buildOrderHtml({ transactionId, orderId, customer, items, subtotal, deliveryCharge, total, paymentMethod, paymentProvider, isAdmin: false });
  const adminHtml = buildOrderHtml({ transactionId, orderId, customer, items, subtotal, deliveryCharge, total, paymentMethod, paymentProvider, isAdmin: true });

  await sendViaResend({
    to: customer.email,
    subject: `Fomino Order Confirmed — ${transactionId}`,
    html: buyerHtml,
  });

  if (adminEmail) {
    await sendViaResend({
      to: adminEmail,
      subject: `[Fomino] New Order — ${transactionId}`,
      html: adminHtml,
    });
  }
}

async function sendContactEmail({ name, email, phone, message }) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    console.log(`[CONTACT SKIPPED] From: ${name} <${email}>: ${message}`);
    return;
  }

  await sendViaResend({
    to: adminEmail,
    subject: `[Fomino Contact] Message from ${name}`,
    html: `<p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><strong>Phone:</strong> ${phone || 'N/A'}</p><p><strong>Message:</strong></p><p>${message}</p>`,
  });
}

module.exports = { sendOrderEmails, sendContactEmail };
