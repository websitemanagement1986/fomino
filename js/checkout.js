function renderCartPage() {
  const items = getCartDetails();
  const container = document.getElementById('cart-content');
  if (!container) return;

  if (!items.length) {
    container.innerHTML = `
      <div class="empty-cart">
        <h2>Your cart is empty</h2>
        <p>Add fresh fruits, vegetables and groceries to get started.</p>
        <a href="categories.html" class="btn btn-primary">Shop Groceries</a>
      </div>`;
    return;
  }

  const rows = items.map((item) => `
    <tr>
      <td><a href="product.html?id=${item.id}">${item.name}</a><br><small>${item.packSize}</small></td>
      <td>₹${item.price.toLocaleString('en-IN')}</td>
      <td>
        <div class="qty-control">
          <button onclick="updateQuantity('${item.id}', ${item.qty - 1}); renderCartPage();">−</button>
          <span>${item.qty}</span>
          <button onclick="updateQuantity('${item.id}', ${item.qty + 1}); renderCartPage();">+</button>
        </div>
      </td>
      <td>₹${item.lineTotal.toLocaleString('en-IN')}</td>
      <td><button class="btn-remove" onclick="removeFromCart('${item.id}'); renderCartPage();">✕</button></td>
    </tr>`).join('');

  const subtotal = getCartTotal();
  const delivery = getDeliveryCharge();
  const total = getOrderTotal();
  container.innerHTML = `
    <table class="cart-table">
      <thead><tr><th>Product</th><th>Price</th><th>Qty</th><th>Total</th><th></th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="cart-summary">
      <div class="cart-total"><span>Subtotal</span><strong>₹${subtotal.toLocaleString('en-IN')}</strong></div>
      <div class="cart-total"><span>Delivery</span><strong>${delivery ? `₹${delivery.toLocaleString('en-IN')}` : 'FREE'}</strong></div>
      <div class="cart-total">
        <span>Order Total</span>
        <strong>₹${total.toLocaleString('en-IN')}</strong>
      </div>
      <p class="delivery-note">Free delivery on orders above ₹500 · ₹50 standard charge below ₹500 · <a href="shipping.html">Shipping Policy</a></p>
      <a href="checkout.html" class="btn btn-primary btn-lg">Proceed to Checkout</a>
    </div>`;
}

function validateCheckoutForm(data) {
  const errors = [];
  if (!data.name?.trim()) errors.push('Full name is required');
  if (!data.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.push('Valid email is required');
  if (!data.phone?.trim() || !/^[6-9]\d{9}$/.test(data.phone.replace(/\D/g, '').slice(-10))) errors.push('Valid 10-digit Indian mobile number is required');
  if (!data.address?.trim()) errors.push('Address is required');
  if (!data.city?.trim()) errors.push('City is required');
  if (!data.state?.trim()) errors.push('State is required');
  if (!data.pincode?.trim() || !/^\d{6}$/.test(data.pincode)) errors.push('Valid 6-digit pincode is required');
  if (getCart().length === 0) errors.push('Your cart is empty');
  return errors;
}

function getCheckoutData() {
  return {
    name: document.getElementById('name')?.value.trim(),
    email: document.getElementById('email')?.value.trim(),
    phone: document.getElementById('phone')?.value.trim(),
    address: document.getElementById('address')?.value.trim(),
    city: document.getElementById('city')?.value.trim(),
    state: document.getElementById('state')?.value.trim(),
    pincode: document.getElementById('pincode')?.value.trim(),
  };
}

function getPaymentMethod() {
  const selected = document.querySelector('input[name="payment"]:checked');
  return selected?.value || 'online';
}

function updateCheckoutButton() {
  const btn = document.getElementById('pay-btn');
  if (!btn) return;
  btn.textContent = getPaymentMethod() === 'cod' ? 'Place Order (COD)' : 'Pay Now';
}

function renderCheckoutSummary() {
  const el = document.getElementById('checkout-summary');
  if (!el) return;
  const items = getCartDetails();
  const subtotal = getCartTotal();
  const delivery = getDeliveryCharge();
  const total = getOrderTotal();
  const method = getPaymentMethod();
  el.innerHTML = `
    <h3>Order Summary</h3>
    ${items.map((i) => `<div class="summary-row"><span>${i.name} × ${i.qty}</span><span>₹${i.lineTotal.toLocaleString('en-IN')}</span></div>`).join('')}
    <div class="summary-row"><span>Subtotal</span><span>₹${subtotal.toLocaleString('en-IN')}</span></div>
    <div class="summary-row"><span>Delivery</span><span>${delivery ? `₹${delivery.toLocaleString('en-IN')}` : 'FREE'}</span></div>
    <div class="summary-row total"><span>Total</span><span>₹${total.toLocaleString('en-IN')}</span></div>
    <p class="payment-note">${method === 'cod'
      ? '💵 Pay cash when your order is delivered'
      : '🔒 Secure payment via Razorpay — UPI, Cards & Net Banking'}</p>`;
}

function saveOrderAndRedirect(order) {
  sessionStorage.setItem('fomino_order', JSON.stringify(order));
  clearCart();
  window.location.href = 'success.html';
}

async function placeCodOrder() {
  const data = getCheckoutData();
  const errors = validateCheckoutForm(data);
  const errEl = document.getElementById('checkout-errors');
  if (errors.length) {
    if (errEl) errEl.innerHTML = errors.map((e) => `<p>${e}</p>`).join('');
    return;
  }
  if (errEl) errEl.innerHTML = '';

  const btn = document.getElementById('pay-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Placing order...'; }

  const cart = getCart();
  try {
    const res = await fetch('/api/place-cod-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cart, customer: data }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to place order');

    saveOrderAndRedirect({
      transactionId: result.transaction_id,
      amount: getOrderTotal(),
      paymentMethod: 'cod',
      customer: data,
      items: getCartDetails(),
    });
  } catch (err) {
    alert(err.message);
    if (btn) { btn.disabled = false; updateCheckoutButton(); }
  }
}

async function initiatePayment() {
  if (getPaymentMethod() === 'cod') {
    return placeCodOrder();
  }

  const data = getCheckoutData();
  const errors = validateCheckoutForm(data);
  const errEl = document.getElementById('checkout-errors');
  if (errors.length) {
    if (errEl) errEl.innerHTML = errors.map((e) => `<p>${e}</p>`).join('');
    return;
  }
  if (errEl) errEl.innerHTML = '';

  const btn = document.getElementById('pay-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Processing...'; }

  const cart = getCart();
  try {
    const res = await fetch('/api/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cart, customer: data }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to create order');

    const options = {
      key: result.key_id,
      amount: result.amount,
      currency: result.currency,
      name: 'Fomino',
      description: 'Grocery Order',
      order_id: result.order_id,
      prefill: { name: data.name, email: data.email, contact: data.phone },
      theme: { color: '#689f38' },
      handler: async function (response) {
        try {
          const verifyRes = await fetch('/api/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...response, customer: data, cart }),
          });
          const verifyData = await verifyRes.json();
          if (!verifyRes.ok) throw new Error(verifyData.error || 'Payment verification failed');

          saveOrderAndRedirect({
            transactionId: verifyData.transaction_id,
            amount: result.amount / 100,
            paymentMethod: 'online',
            customer: data,
            items: getCartDetails(),
          });
        } catch (err) {
          alert('Payment verification failed: ' + err.message);
        }
      },
      modal: {
        ondismiss: function () {
          if (btn) { btn.disabled = false; btn.textContent = 'Pay Now'; }
        },
      },
    };

    const rzp = new Razorpay(options);
    rzp.on('payment.failed', () => { window.location.href = 'cancel.html'; });
    rzp.open();
  } catch (err) {
    alert(err.message + '\n\nNote: Payment API requires server with Razorpay keys configured.');
    if (btn) { btn.disabled = false; updateCheckoutButton(); }
  }
}

function renderSuccessPage() {
  const raw = sessionStorage.getItem('fomino_order');
  const el = document.getElementById('success-content');
  if (!el) return;
  if (!raw) {
    el.innerHTML = '<p>No order found. <a href="index.html">Go home</a></p>';
    return;
  }
  const order = JSON.parse(raw);
  const isCod = order.paymentMethod === 'cod';
  el.innerHTML = `
    <div class="success-box">
      <div class="success-icon">✓</div>
      <h1>${isCod ? 'Order Placed Successfully!' : 'Payment Successful!'}</h1>
      ${isCod ? '<p class="cod-note">Pay cash when your order is delivered.</p>' : ''}
      <p class="txn-id">Order ID: <strong>${order.transactionId}</strong></p>
      <p>Thank you, ${order.customer.name}! A confirmation email has been sent to <strong>${order.customer.email}</strong>.</p>
      <div class="order-details">
        <h3>Order Details</h3>
        ${order.items.map((i) => `<p>${i.name} × ${i.qty} — ₹${i.lineTotal.toLocaleString('en-IN')}</p>`).join('')}
        <p class="order-total"><strong>Total: ₹${order.amount.toLocaleString('en-IN')}</strong></p>
        <p><strong>Payment:</strong> ${isCod ? 'Cash on Delivery' : 'Paid Online'}</p>
      </div>
      <p class="support-note">For support, call <a href="tel:${FOMINO.phone}">${FOMINO.phoneDisplay}</a> or email <a href="mailto:${FOMINO.email}">${FOMINO.email}</a></p>
      <a href="index.html" class="btn btn-primary">Continue Shopping</a>
    </div>`;
  sessionStorage.removeItem('fomino_order');
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('cart-content')) renderCartPage();
  if (document.getElementById('checkout-summary')) renderCheckoutSummary();
  if (document.getElementById('success-content')) renderSuccessPage();

  document.querySelectorAll('input[name="payment"]').forEach((radio) => {
    radio.addEventListener('change', () => {
      updateCheckoutButton();
      renderCheckoutSummary();
    });
  });
  updateCheckoutButton();

  const payBtn = document.getElementById('pay-btn');
  if (payBtn) payBtn.addEventListener('click', initiatePayment);
});
