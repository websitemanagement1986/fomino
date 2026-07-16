const CART_KEY = 'fomino_cart';

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
}

function addToCart(productId, qty = 1) {
  const product = getProduct(productId);
  if (!product || product.price === null) {
    alert('This product is currently unavailable.');
    return false;
  }
  const cart = getCart();
  const existing = cart.find((i) => i.id === productId);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ id: productId, qty });
  }
  saveCart(cart);
  return true;
}

function removeFromCart(productId) {
  saveCart(getCart().filter((i) => i.id !== productId));
}

function updateQuantity(productId, qty) {
  const cart = getCart();
  const item = cart.find((i) => i.id === productId);
  if (!item) return;
  if (qty <= 0) {
    removeFromCart(productId);
    return;
  }
  item.qty = qty;
  saveCart(cart);
}

function clearCart() {
  localStorage.removeItem(CART_KEY);
  updateCartBadge();
}

function getCartTotal() {
  return getCart().reduce((sum, item) => {
    const p = getProduct(item.id);
    return sum + (p && p.price ? p.price * item.qty : 0);
  }, 0);
}

function getDeliveryCharge() {
  const subtotal = getCartTotal();
  return subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_CHARGE;
}

function getOrderTotal() {
  return getCartTotal() + getDeliveryCharge();
}

function getCartCount() {
  return getCart().reduce((sum, item) => sum + item.qty, 0);
}

function getCartDetails() {
  return getCart().map((item) => {
    const product = getProduct(item.id);
    return {
      id: item.id,
      name: product.name,
      vendor: product.vendor,
      packSize: product.packSize,
      price: product.price,
      qty: item.qty,
      lineTotal: product.price * item.qty,
    };
  });
}

function updateCartBadge() {
  const badges = document.querySelectorAll('.cart-badge');
  const count = getCartCount();
  badges.forEach((el) => {
    el.textContent = count;
    el.style.display = count > 0 ? 'flex' : 'none';
  });
}

document.addEventListener('DOMContentLoaded', updateCartBadge);
