const FOMINO = {
  name: 'Fomino',
  company: 'Fomino Product Hub Pvt Ltd',
  contactPerson: 'Pavan Kumar',
  phone: '+917840819741',
  phoneDisplay: '+91 7840819741',
  email: 'support@fominomart.in',
  address: 'Office no O-1231, Gaur City Centre, Sec-4, Greater Noida West, Gautam Buddha Nagar, UP 201318',
};

const CATEGORIES = [
  { slug: 'fresh-fruits', name: 'Fresh Fruits', shortName: 'Fruits', icon: '🍎', color: '#e65100', image: 'assets/categories/fresh-fruits.jpg', tagline: 'Farm-fresh fruits delivered daily', description: 'Seasonal and everyday fruits handpicked for freshness and quality.' },
  { slug: 'fresh-vegetables', name: 'Fresh Vegetables', shortName: 'Vegetables', icon: '🥬', color: '#558b2f', image: 'assets/categories/fresh-vegetables.jpg', tagline: 'Crisp vegetables from local farms', description: 'Daily essentials and seasonal vegetables for your kitchen.' },
  { slug: 'exotic', name: 'Exotic Fruits & Veggies', shortName: 'Exotic', icon: '🥑', color: '#7cb342', image: 'assets/categories/exotic.jpg', tagline: 'Premium exotic produce', description: 'Broccoli, blueberries, avocado and more specialty items.' },
  { slug: 'organic', name: 'Organic Produce', shortName: 'Organic', icon: '🌿', color: '#33691e', image: 'assets/categories/organic.jpg', tagline: 'Certified organic goodness', description: 'Chemical-free organic fruits and vegetables for healthy living.' },
  { slug: 'staples', name: 'Grocery & Staples', shortName: 'Staples', icon: '🌾', color: '#f9a825', image: 'assets/categories/staples.jpg', tagline: 'Rice, dal, atta & more', description: 'Daily kitchen staples at great prices.' },
  { slug: 'dairy', name: 'Dairy & Bread', shortName: 'Dairy', icon: '🥛', color: '#5d4037', image: 'assets/categories/dairy.jpg', tagline: 'Fresh dairy every morning', description: 'Milk, curd, paneer, bread and bakery essentials.' },
  { slug: 'beverages', name: 'Beverages', shortName: 'Beverages', icon: '🥤', color: '#0277bd', image: 'assets/categories/beverages.jpg', tagline: 'Juices, tea & coffee', description: 'Refreshing drinks for every occasion.' },
  { slug: 'snacks', name: 'Snacks', shortName: 'Snacks', icon: '🍪', color: '#bf360c', image: 'assets/categories/snacks.jpg', tagline: 'Biscuits & namkeen', description: 'Tea-time snacks and munchies for the family.' },
];

const PRODUCTS = [
  // Fresh Fruits
  { id: 'banana-robusta', category: 'fresh-fruits', name: 'Banana — Robusta', vendor: 'Fomino Fresh', rating: 4.4, price: 38, originalPrice: 48, packSize: '500 g', description: 'Sweet and ripe Robusta bananas. Approx. 3–4 pcs per pack.', features: ['Naturally ripened', 'Rich in potassium', 'Perfect for smoothies'] },
  { id: 'mango-alphonso', category: 'fresh-fruits', name: 'Mango — Alphonso', vendor: 'Fomino Fresh', rating: 4.8, price: 299, originalPrice: 399, packSize: '1 kg', description: 'Premium Ratnagiri Alphonso mangoes. King of mangoes!', features: ['Seasonal favourite', 'Sweet & aromatic', 'Hand sorted'] },
  { id: 'apple-gala', category: 'fresh-fruits', name: 'Apple — Royal Gala', vendor: 'Fomino Fresh', rating: 4.5, price: 189, originalPrice: 249, packSize: '4 pcs', description: 'Crisp Royal Gala apples. Approx. 400–500 g per pack.', features: ['Imported quality', 'Crunchy texture', 'Rich in fibre'] },
  { id: 'pomegranate', category: 'fresh-fruits', name: 'Pomegranate', vendor: 'Fomino Fresh', rating: 4.3, price: 145, originalPrice: 195, packSize: '2 pcs', description: 'Juicy pomegranate with ruby-red arils. Approx. 220–250 g per pc.', features: ['Antioxidant rich', 'Freshly picked', 'Premium grade'] },
  { id: 'orange-imported', category: 'fresh-fruits', name: 'Orange — Imported', vendor: 'Fomino Fresh', rating: 4.2, price: 99, originalPrice: 134, packSize: '500 g', description: 'Sweet imported oranges. Great for fresh juice.', features: ['Vitamin C rich', 'Easy to peel', 'Juicy segments'] },
  { id: 'watermelon', category: 'fresh-fruits', name: 'Watermelon — Striped', vendor: 'Fomino Fresh', rating: 4.1, price: 59, originalPrice: 79, packSize: '1 pc', description: 'Refreshing striped watermelon. Approx. 2–3 kg per piece.', features: ['Summer special', 'Hydrating', 'Sweet flesh'] },
  { id: 'grapes-green', category: 'fresh-fruits', name: 'Grapes — Green Seedless', vendor: 'Fomino Fresh', rating: 4.4, price: 89, originalPrice: 119, packSize: '250 g', description: 'Crisp seedless green grapes. Perfect snack.', features: ['Seedless', 'Sweet & crisp', 'Washed & packed'] },

  // Fresh Vegetables
  { id: 'tomato-local', category: 'fresh-vegetables', name: 'Tomato — Local', vendor: 'Fomino Fresh', rating: 4.3, price: 32, originalPrice: 42, packSize: '1 kg', description: 'Farm-fresh local tomatoes for curries and salads.', features: ['Daily harvest', 'Juicy & firm', 'Great for cooking'] },
  { id: 'onion', category: 'fresh-vegetables', name: 'Onion', vendor: 'Fomino Fresh', rating: 4.5, price: 28, originalPrice: 38, packSize: '1 kg', description: 'Essential kitchen onion. Stored and packed fresh.', features: ['Long shelf life', 'Pungent flavour', 'Har Din Sasta!'] },
  { id: 'potato', category: 'fresh-vegetables', name: 'Potato', vendor: 'Fomino Fresh', rating: 4.4, price: 25, originalPrice: 35, packSize: '1 kg', description: 'Versatile potatoes for every Indian dish.', features: ['Starch rich', 'Clean & sorted', 'Great value'] },
  { id: 'carrot-orange', category: 'fresh-vegetables', name: 'Carrot — Orange', vendor: 'Fomino Fresh', rating: 4.2, price: 28, originalPrice: 36, packSize: '500 g', description: 'Sweet orange carrots. Ideal for gajar halwa and salads.', features: ['Beta-carotene rich', 'Crisp texture', 'Washed'] },
  { id: 'capsicum-green', category: 'fresh-vegetables', name: 'Capsicum — Green', vendor: 'Fomino Fresh', rating: 4.1, price: 32, originalPrice: 40, packSize: '250 g', description: 'Fresh green bell peppers for stir-fry and pizza.', features: ['Crunchy', 'Vitamin rich', 'Uniform size'] },
  { id: 'cauliflower', category: 'fresh-vegetables', name: 'Cauliflower', vendor: 'Fomino Fresh', rating: 4.0, price: 35, originalPrice: 48, packSize: '1 pc', description: 'White cauliflower head. Approx. 400–600 g.', features: ['Tight florets', 'Fresh daily', 'Pesticide washed'] },
  { id: 'spinach-palak', category: 'fresh-vegetables', name: 'Palak — Cleaned', vendor: 'Fomino Fresh', rating: 4.3, price: 18, originalPrice: 24, packSize: '250 g', description: 'Pre-cleaned palak leaves. Ready to cook.', features: ['Iron rich', 'No roots', 'Washed & packed'] },
  { id: 'ginger', category: 'fresh-vegetables', name: 'Ginger', vendor: 'Fomino Fresh', rating: 4.2, price: 28, originalPrice: 36, packSize: '100 g', description: 'Aromatic fresh ginger root.', features: ['Strong flavour', 'Anti-inflammatory', 'Fresh harvest'] },

  // Exotic
  { id: 'broccoli', category: 'exotic', name: 'Broccoli', vendor: 'Fomino Fresh', rating: 4.4, price: 55, originalPrice: 78, packSize: '1 pc', description: 'Fresh broccoli crown. Approx. 200–350 g.', features: ['Nutrient dense', 'Tight florets', 'Exotic import'] },
  { id: 'blueberry', category: 'exotic', name: 'Blueberry', vendor: 'Fomino Fresh', rating: 4.6, price: 199, originalPrice: 288, packSize: '125 g', description: 'Premium imported blueberries.', features: ['Antioxidant superfood', 'Sweet & tangy', 'Chilled delivery'] },
  { id: 'avocado', category: 'exotic', name: 'Avocado', vendor: 'Fomino Fresh', rating: 4.3, price: 89, originalPrice: 120, packSize: '1 pc', description: 'Ripe Hass avocado. Perfect for guacamole.', features: ['Healthy fats', 'Creamy texture', 'Imported'] },
  { id: 'zucchini', category: 'exotic', name: 'Zucchini — Green', vendor: 'Fomino Fresh', rating: 4.1, price: 45, originalPrice: 65, packSize: '250 g', description: 'Tender green zucchini for continental dishes.', features: ['Low calorie', 'Versatile', 'Farm fresh'] },
  { id: 'lettuce-iceberg', category: 'exotic', name: 'Lettuce — Iceberg', vendor: 'Fomino Fresh', rating: 4.0, price: 35, originalPrice: 48, packSize: '1 pc', description: 'Crisp iceberg lettuce for salads and burgers.', features: ['Crunchy leaves', 'Hydroponic', 'Washed'] },
  { id: 'mushroom-button', category: 'exotic', name: 'Mushroom — Button', vendor: 'Fomino Fresh', rating: 4.5, price: 55, originalPrice: 72, packSize: '200 g', description: 'Fresh button mushrooms in a sealed pack.', features: ['Protein rich', 'Tender', 'Ready to cook'] },

  // Organic
  { id: 'organic-tomato', category: 'organic', name: 'Tomato — Organic', vendor: 'Fomino Fresh', rating: 4.6, price: 48, originalPrice: 62, packSize: '1 kg', description: 'Certified organic tomatoes. No chemical pesticides.', features: ['Certified organic', 'Chemical free', 'Farm traceable'] },
  { id: 'organic-onion', category: 'organic', name: 'Onion — Organic', vendor: 'Fomino Fresh', rating: 4.5, price: 42, originalPrice: 55, packSize: '1 kg', description: 'Organically grown onions from certified farms.', features: ['Organic certified', 'Natural farming', 'Premium quality'] },
  { id: 'organic-ginger', category: 'organic', name: 'Ginger — Organic', vendor: 'Fomino Fresh', rating: 4.4, price: 38, originalPrice: 50, packSize: '100 g', description: 'Organic ginger root with intense aroma.', features: ['Pesticide free', 'Strong flavour', 'Certified'] },
  { id: 'organic-carrot', category: 'organic', name: 'Carrot — Organic', vendor: 'Fomino Fresh', rating: 4.3, price: 38, originalPrice: 48, packSize: '500 g', description: 'Sweet organic carrots. Perfect for juicing.', features: ['Organic', 'Sweet taste', 'Washed'] },
  { id: 'organic-spinach', category: 'organic', name: 'Spinach — Organic', vendor: 'Fomino Fresh', rating: 4.4, price: 28, originalPrice: 36, packSize: '250 g', description: 'Tender organic spinach leaves.', features: ['Leafy greens', 'Iron rich', 'Chemical free'] },

  // Staples
  { id: 'basmati-rice', category: 'staples', name: 'Basmati Rice — Premium', vendor: 'Fomino Fresh', rating: 4.6, price: 189, originalPrice: 220, packSize: '5 kg', description: 'Long-grain aged basmati rice. Aromatic and fluffy.', features: ['Aged basmati', 'Extra long grain', 'Low GI'] },
  { id: 'toor-dal', category: 'staples', name: 'Toor Dal', vendor: 'Fomino Fresh', rating: 4.5, price: 145, originalPrice: 165, packSize: '1 kg', description: 'Unpolished toor dal for authentic dal tadka.', features: ['Protein rich', 'Unpolished', 'Stone ground'] },
  { id: 'atta-whole-wheat', category: 'staples', name: 'Atta — Whole Wheat', vendor: 'Fomino Fresh', rating: 4.4, price: 249, originalPrice: 279, packSize: '10 kg', description: 'Chakki-fresh whole wheat atta for soft rotis.', features: ['100% whole wheat', 'Chakki ground', 'No maida mix'] },
  { id: 'sunflower-oil', category: 'staples', name: 'Sunflower Oil', vendor: 'Fomino Fresh', rating: 4.3, price: 165, originalPrice: 185, packSize: '1 L', description: 'Refined sunflower cooking oil.', features: ['Light taste', 'High smoke point', 'Fortified'] },
  { id: 'sugar', category: 'staples', name: 'Sugar — Refined', vendor: 'Fomino Fresh', rating: 4.2, price: 48, originalPrice: 55, packSize: '1 kg', description: 'Fine crystal white sugar for daily use.', features: ['Fine crystals', 'Pure cane', 'Food grade'] },
  { id: 'turmeric-powder', category: 'staples', name: 'Turmeric Powder', vendor: 'Fomino Fresh', rating: 4.4, price: 55, originalPrice: 65, packSize: '200 g', description: 'Pure haldi powder with rich colour and aroma.', features: ['Pure turmeric', 'No additives', 'Vibrant colour'] },

  // Dairy
  { id: 'milk-toned', category: 'dairy', name: 'Milk — Toned', vendor: 'Fomino Fresh', rating: 4.5, price: 28, originalPrice: 32, packSize: '500 ml', description: 'Fresh toned milk. Pasteurised and homogenised.', features: ['Pasteurised', 'Daily delivery', 'Calcium rich'] },
  { id: 'curd', category: 'dairy', name: 'Curd — Set', vendor: 'Fomino Fresh', rating: 4.4, price: 35, originalPrice: 42, packSize: '400 g', description: 'Thick set curd made from fresh milk.', features: ['Probiotic', 'Thick texture', 'No preservatives'] },
  { id: 'paneer', category: 'dairy', name: 'Paneer — Fresh', vendor: 'Fomino Fresh', rating: 4.6, price: 89, originalPrice: 105, packSize: '200 g', description: 'Soft fresh paneer for curries and snacks.', features: ['Soft & fresh', 'High protein', 'Made daily'] },
  { id: 'brown-bread', category: 'dairy', name: 'Bread — Brown', vendor: 'Fomino Fresh', rating: 4.2, price: 45, originalPrice: 55, packSize: '400 g', description: 'Whole wheat brown bread. No added colour.', features: ['Whole wheat', 'High fibre', 'Baked fresh'] },
  { id: 'butter', category: 'dairy', name: 'Butter — Salted', vendor: 'Fomino Fresh', rating: 4.3, price: 55, originalPrice: 62, packSize: '100 g', description: 'Creamy salted table butter.', features: ['Creamy', 'Spreadable', 'Pure dairy'] },

  // Beverages
  { id: 'orange-juice', category: 'beverages', name: 'Orange Juice — Pack', vendor: 'Fomino Fresh', rating: 4.1, price: 99, originalPrice: 120, packSize: '1 L', description: 'Ready-to-drink orange juice. No added sugar.', features: ['Vitamin C', 'No added sugar', 'Chilled'] },
  { id: 'tea-leaves', category: 'beverages', name: 'Tea — Premium Leaves', vendor: 'Fomino Fresh', rating: 4.5, price: 185, originalPrice: 210, packSize: '500 g', description: 'Assam blend premium tea leaves.', features: ['Strong brew', 'Assam blend', 'Aromatic'] },
  { id: 'coffee-instant', category: 'beverages', name: 'Coffee — Instant', vendor: 'Fomino Fresh', rating: 4.3, price: 299, originalPrice: 349, packSize: '200 g', description: 'Rich instant coffee for a perfect morning cup.', features: ['Rich aroma', 'Smooth taste', 'Easy brew'] },
  { id: 'coconut-water', category: 'beverages', name: 'Coconut Water — Pack', vendor: 'Fomino Fresh', rating: 4.2, price: 45, originalPrice: 55, packSize: '200 ml', description: 'Natural coconut water. Hydrating and refreshing.', features: ['Electrolytes', 'Natural', 'No preservatives'] },
  { id: 'green-tea', category: 'beverages', name: 'Green Tea — Bags', vendor: 'Fomino Fresh', rating: 4.4, price: 149, originalPrice: 175, packSize: '25 bags', description: 'Antioxidant-rich green tea bags.', features: ['Antioxidants', 'Weight management', '25 tea bags'] },

  // Snacks
  { id: 'marie-biscuits', category: 'snacks', name: 'Marie Biscuits', vendor: 'Fomino Fresh', rating: 4.2, price: 28, originalPrice: 35, packSize: '250 g', description: 'Light and crispy Marie biscuits for tea time.', features: ['Light & crispy', 'Low fat', 'Family pack'] },
  { id: 'namkeen-mix', category: 'snacks', name: 'Namkeen — Mix', vendor: 'Fomino Fresh', rating: 4.3, price: 55, originalPrice: 68, packSize: '200 g', description: 'Spicy mixed namkeen. Perfect evening snack.', features: ['Crunchy', 'Spiced blend', 'Freshly packed'] },
  { id: 'potato-chips', category: 'snacks', name: 'Potato Chips — Classic', vendor: 'Fomino Fresh', rating: 4.1, price: 20, originalPrice: 25, packSize: '52 g', description: 'Classic salted potato chips.', features: ['Crispy', 'Classic salt', 'Single serve'] },
  { id: 'cookies-assorted', category: 'snacks', name: 'Cookies — Assorted', vendor: 'Fomino Fresh', rating: 4.4, price: 89, originalPrice: 110, packSize: '400 g', description: 'Assorted butter cookies in a gift pack.', features: ['Butter rich', 'Assorted flavours', 'Gift pack'] },
  { id: 'peanuts-roasted', category: 'snacks', name: 'Peanuts — Roasted', vendor: 'Fomino Fresh', rating: 4.3, price: 65, originalPrice: 78, packSize: '200 g', description: 'Salted roasted peanuts. High protein snack.', features: ['Protein rich', 'Roasted', 'Salted'] },
];

const PRODUCT_IMAGE_BASE = 'assets/products';

const PRODUCT_IMAGES = Object.fromEntries(
  PRODUCTS.map((p) => [p.id, `${PRODUCT_IMAGE_BASE}/${p.id}.jpg`])
);

PRODUCTS.forEach((p) => {
  p.image = PRODUCT_IMAGES[p.id];
});

function getProductImage(product) {
  if (!product) return '';
  return product.image || PRODUCT_IMAGES[product.id] || `${PRODUCT_IMAGE_BASE}/${product.id}.jpg`;
}

function getCategory(slug) {
  return CATEGORIES.find((c) => c.slug === slug);
}

function getProductsByCategory(slug) {
  return PRODUCTS.filter((p) => p.category === slug);
}

function getProduct(id) {
  return PRODUCTS.find((p) => p.id === id);
}

function formatPrice(product) {
  return `₹${product.price.toLocaleString('en-IN')}`;
}

function getDiscount(product) {
  if (!product.originalPrice || !product.price) return null;
  const pct = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
  return pct > 0 ? `${pct}% OFF` : null;
}

function getDealBadge(product) {
  if (product.originalPrice && product.price && product.originalPrice - product.price >= 15) {
    return 'Har Din Sasta!';
  }
  return null;
}

function getProductCount(categorySlug) {
  return PRODUCTS.filter((p) => p.category === categorySlug).length;
}

function getDealsProducts() {
  return PRODUCTS.filter((p) => p.originalPrice && p.price && p.originalPrice > p.price)
    .sort((a, b) => ((b.originalPrice - b.price) / b.originalPrice) - ((a.originalPrice - a.price) / a.originalPrice))
    .slice(0, 8);
}

function getTrendingProducts() {
  return [...PRODUCTS].sort((a, b) => b.rating - a.rating).slice(0, 8);
}

if (typeof module !== 'undefined') {
  module.exports = {
    FOMINO, CATEGORIES, PRODUCTS, PRODUCT_IMAGES,
    getCategory, getProductsByCategory, getProduct, getProductImage,
    formatPrice, getDiscount, getDealBadge, getProductCount,
    getDealsProducts, getTrendingProducts,
  };
}
