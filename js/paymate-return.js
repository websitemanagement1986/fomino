function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function renderSuccess(order) {
  const el = document.getElementById('paymate-return-content');
  if (!el) return;

  clearCart();
  sessionStorage.removeItem('fomino_paymate_pending');

  el.innerHTML = `
    <div class="success-icon">✓</div>
    <h1>Payment Successful!</h1>
    <p class="txn-id">Order ID: <strong>${order.transaction_id}</strong></p>
    <p>Thank you, ${order.customer.name}! A confirmation email has been sent to <strong>${order.customer.email}</strong>.</p>
    <div class="order-details">
      <h3>Order Details</h3>
      ${order.items.map((i) => `<p>${i.name} × ${i.qty} — ₹${i.lineTotal.toLocaleString('en-IN')}</p>`).join('')}
      <p class="order-total"><strong>Total: ₹${Number(order.amount).toLocaleString('en-IN')}</strong></p>
      <p><strong>Payment:</strong> Paid Online via PayMate</p>
    </div>
    <p class="support-note">For support, call <a href="tel:${FOMINO.phone}">${FOMINO.phoneDisplay}</a> or email <a href="mailto:${FOMINO.email}">${FOMINO.email}</a></p>
    <a href="index.html" class="btn btn-primary">Continue Shopping</a>`;
}

function renderPending(message) {
  const el = document.getElementById('paymate-return-content');
  if (!el) return;
  el.innerHTML = `
    <h1>Payment Pending</h1>
    <p>${message}</p>
    <button id="retry-status" class="btn btn-primary">Check Again</button>
    <a href="checkout.html" class="btn" style="margin-left:12px;">Back to Checkout</a>`;
  document.getElementById('retry-status')?.addEventListener('click', checkPaymentStatus);
}

function renderFailure(message) {
  const el = document.getElementById('paymate-return-content');
  if (!el) return;
  el.innerHTML = `
    <h1>Payment Failed</h1>
    <p>${message}</p>
    <a href="checkout.html" class="btn btn-primary">Try Again</a>
    <a href="cancel.html" class="btn" style="margin-left:12px;">View Cancel Page</a>`;
}

async function checkPaymentStatus() {
  const orderId = getQueryParam('orderId');
  const el = document.getElementById('paymate-return-content');
  if (!orderId) {
    renderFailure('Missing order reference in return URL.');
    return;
  }

  if (el) {
    el.innerHTML = '<p>Checking your payment status...</p>';
  }

  try {
    const res = await fetch(`/api/paymate/status?orderId=${encodeURIComponent(orderId)}`);
    const data = await res.json();

    if (res.ok && data.success && data.status === 'paid') {
      const pendingRaw = sessionStorage.getItem('fomino_paymate_pending');
      const pending = pendingRaw ? JSON.parse(pendingRaw) : null;
      renderSuccess({
        transaction_id: data.transaction_id,
        amount: data.amount,
        customer: data.customer || pending?.customer,
        items: data.items || pending?.items || [],
      });
      return;
    }

    if (data.status === 'failed') {
      renderFailure(data.message || 'Your payment could not be completed.');
      return;
    }

    renderPending(data.message || 'Your payment is still being processed.');
  } catch (err) {
    renderFailure(err.message || 'Unable to verify payment status.');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  checkPaymentStatus();
});
