const PRODUCTS = [
  { id: 'banana-robusta', name: 'Banana — Robusta', price: 38 },
  { id: 'mango-alphonso', name: 'Mango — Alphonso', price: 299 },
  { id: 'apple-gala', name: 'Apple — Royal Gala', price: 189 },
  { id: 'pomegranate', name: 'Pomegranate', price: 145 },
  { id: 'orange-imported', name: 'Orange — Imported', price: 99 },
  { id: 'watermelon', name: 'Watermelon — Striped', price: 59 },
  { id: 'grapes-green', name: 'Grapes — Green Seedless', price: 89 },
  { id: 'tomato-local', name: 'Tomato — Local', price: 32 },
  { id: 'onion', name: 'Onion', price: 28 },
  { id: 'potato', name: 'Potato', price: 25 },
  { id: 'carrot-orange', name: 'Carrot — Orange', price: 28 },
  { id: 'capsicum-green', name: 'Capsicum — Green', price: 32 },
  { id: 'cauliflower', name: 'Cauliflower', price: 35 },
  { id: 'spinach-palak', name: 'Palak — Cleaned', price: 18 },
  { id: 'ginger', name: 'Ginger', price: 28 },
  { id: 'broccoli', name: 'Broccoli', price: 55 },
  { id: 'blueberry', name: 'Blueberry', price: 199 },
  { id: 'avocado', name: 'Avocado', price: 89 },
  { id: 'zucchini', name: 'Zucchini — Green', price: 45 },
  { id: 'lettuce-iceberg', name: 'Lettuce — Iceberg', price: 35 },
  { id: 'mushroom-button', name: 'Mushroom — Button', price: 55 },
  { id: 'organic-tomato', name: 'Tomato — Organic', price: 48 },
  { id: 'organic-onion', name: 'Onion — Organic', price: 42 },
  { id: 'organic-ginger', name: 'Ginger — Organic', price: 38 },
  { id: 'organic-carrot', name: 'Carrot — Organic', price: 38 },
  { id: 'organic-spinach', name: 'Spinach — Organic', price: 28 },
  { id: 'basmati-rice', name: 'Basmati Rice — Premium', price: 189 },
  { id: 'toor-dal', name: 'Toor Dal', price: 145 },
  { id: 'atta-whole-wheat', name: 'Atta — Whole Wheat', price: 249 },
  { id: 'sunflower-oil', name: 'Sunflower Oil', price: 165 },
  { id: 'sugar', name: 'Sugar — Refined', price: 48 },
  { id: 'turmeric-powder', name: 'Turmeric Powder', price: 55 },
  { id: 'milk-toned', name: 'Milk — Toned', price: 28 },
  { id: 'curd', name: 'Curd — Set', price: 35 },
  { id: 'paneer', name: 'Paneer — Fresh', price: 89 },
  { id: 'brown-bread', name: 'Bread — Brown', price: 45 },
  { id: 'butter', name: 'Butter — Salted', price: 55 },
  { id: 'orange-juice', name: 'Orange Juice — Pack', price: 99 },
  { id: 'tea-leaves', name: 'Tea — Premium Leaves', price: 185 },
  { id: 'coffee-instant', name: 'Coffee — Instant', price: 299 },
  { id: 'coconut-water', name: 'Coconut Water — Pack', price: 45 },
  { id: 'green-tea', name: 'Green Tea — Bags', price: 149 },
  { id: 'marie-biscuits', name: 'Marie Biscuits', price: 28 },
  { id: 'namkeen-mix', name: 'Namkeen — Mix', price: 55 },
  { id: 'potato-chips', name: 'Potato Chips — Classic', price: 20 },
  { id: 'cookies-assorted', name: 'Cookies — Assorted', price: 89 },
  { id: 'peanuts-roasted', name: 'Peanuts — Roasted', price: 65 },
];

function validateCart(cart) {
  if (!Array.isArray(cart) || cart.length === 0) {
    throw new Error('Cart is empty');
  }

  const items = [];
  let total = 0;

  for (const entry of cart) {
    const product = PRODUCTS.find((p) => p.id === entry.id);
    if (!product) throw new Error(`Unknown product: ${entry.id}`);
    const qty = Number(entry.qty);
    if (!qty || qty < 1 || qty > 99) throw new Error(`Invalid quantity for ${product.name}`);
    const lineTotal = product.price * qty;
    items.push({ id: product.id, name: product.name, price: product.price, qty, lineTotal });
    total += lineTotal;
  }

  if (total <= 0) throw new Error('Invalid order total');

  return { items, total, amountPaise: Math.round(total * 100) };
}

module.exports = { PRODUCTS, validateCart };
