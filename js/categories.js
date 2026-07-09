function renderProductCard(product) {
  const discount = getDiscount(product);
  const deal = getDealBadge(product);
  const img = getProductImage(product);
  const icon = getCategory(product.category)?.icon || '🛒';

  return `
    <article class="product-card">
      <a href="product.html?id=${product.id}" class="product-card-link">
        <div class="product-badges">
          ${discount ? `<span class="badge-discount">${discount}</span>` : ''}
          ${deal ? `<span class="badge-deal">${deal}</span>` : ''}
        </div>
        <div class="product-thumb">
          <img src="${img}" alt="${product.name}" loading="lazy" width="400" height="300"
            onerror="this.onerror=null;this.parentElement.innerHTML='<span class=\\'product-thumb-fallback\\'>${icon}</span>'">
        </div>
        <h3>${product.name}</h3>
        <p class="vendor">${product.vendor}</p>
        <p class="pack-size">${product.packSize}</p>
        <div class="rating">★ ${product.rating}</div>
        <div class="price-row">
          <span class="price">₹${product.price.toLocaleString('en-IN')}</span>
          ${product.originalPrice ? `<span class="price-old">₹${product.originalPrice.toLocaleString('en-IN')}</span>` : ''}
        </div>
      </a>
      <div class="product-card-actions">
        <a href="product.html?id=${product.id}" class="btn btn-outline btn-sm">View</a>
        <button class="btn btn-primary btn-sm" onclick="handleAddToCart('${product.id}')">Add to Cart</button>
      </div>
    </article>`;
}

function renderCategoryCard(cat) {
  const count = getProductCount(cat.slug);
  const img = cat.image || '';
  return `
    <a href="category.html?cat=${cat.slug}" class="category-card" style="--cat-color: ${cat.color}">
      <div class="cat-card-photo">
        <img src="${img}" alt="${cat.name}" loading="lazy" width="220" height="180">
      </div>
      <div class="cat-card-body">
        <span class="cat-icon">${cat.icon}</span>
        <h3>${cat.shortName || cat.name}</h3>
        <p>${cat.tagline}</p>
        <span class="cat-count">${count} products →</span>
      </div>
    </a>`;
}

function renderProductGrid(products, containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  if (!products.length) {
    el.innerHTML = '<p class="empty-msg">No products in this category yet.</p>';
    return;
  }
  el.innerHTML = products.map(renderProductCard).join('');
}

function renderCategoryGrid(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = CATEGORIES.map((cat) => renderCategoryCard(cat)).join('');
}

function handleAddToCart(id) {
  if (addToCart(id)) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = 'Added to cart!';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  }
}

function initCategoryTabs(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const tabs = CATEGORIES.slice(0, 6).map((cat, i) =>
    `<button class="tab-btn ${i === 0 ? 'active' : ''}" data-cat="${cat.slug}">${cat.shortName || cat.name}</button>`
  ).join('');

  container.innerHTML = `
    <div class="tabs">${tabs}</div>
    <div id="tab-products" class="product-grid"></div>`;

  const tabBtns = container.querySelectorAll('.tab-btn');
  const showCat = (slug) => {
    tabBtns.forEach((b) => b.classList.toggle('active', b.dataset.cat === slug));
    renderProductGrid(getProductsByCategory(slug), 'tab-products');
  };

  tabBtns.forEach((btn) => btn.addEventListener('click', () => showCat(btn.dataset.cat)));
  showCat(CATEGORIES[0].slug);
}

function initCategoryPage() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('cat');
  const cat = getCategory(slug);
  if (!cat) {
    window.location.href = 'categories.html';
    return;
  }
  document.title = `${cat.name} | Fomino`;
  const titleEl = document.getElementById('page-title');
  const breadcrumbEl = document.getElementById('breadcrumb-cat');
  const descEl = document.getElementById('category-desc');
  if (titleEl) titleEl.textContent = cat.name;
  if (breadcrumbEl) breadcrumbEl.textContent = cat.name;
  if (descEl) descEl.textContent = cat.description;

  const products = getProductsByCategory(slug);
  const sortEl = document.getElementById('sort-select');
  const render = () => {
    let list = [...products];
    const sort = sortEl?.value || 'relevance';
    if (sort === 'price-low') list.sort((a, b) => a.price - b.price);
    if (sort === 'price-high') list.sort((a, b) => b.price - a.price);
    if (sort === 'rating') list.sort((a, b) => b.rating - a.rating);
    renderProductGrid(list, 'category-products');
  };
  if (sortEl) sortEl.addEventListener('change', render);
  render();
}

function initProductPage() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const product = getProduct(id);
  if (!product) {
    window.location.href = 'categories.html';
    return;
  }
  const cat = getCategory(product.category);
  document.title = `${product.name} | Fomino`;

  const el = document.getElementById('product-detail');
  if (!el) return;

  const discount = getDiscount(product);
  const deal = getDealBadge(product);
  const img = getProductImage(product);

  el.innerHTML = `
    <nav class="breadcrumb"><a href="index.html">Home</a> › <a href="category.html?cat=${product.category}">${cat?.name || ''}</a> › ${product.name}</nav>
    <div class="product-detail-grid">
      <div class="product-detail-visual">
        <img src="${img}" alt="${product.name}" class="product-detail-img">
      </div>
      <div class="product-detail-info">
        <h1>${product.name}</h1>
        <p class="vendor">${product.vendor}</p>
        <p class="pack-size-lg">${product.packSize}</p>
        <div class="rating">★ ${product.rating} / 5</div>
        <div class="price-block">
          <p class="price-large">₹${product.price.toLocaleString('en-IN')}</p>
          ${product.originalPrice ? `<p class="price-old-lg">₹${product.originalPrice.toLocaleString('en-IN')}</p>` : ''}
          ${discount ? `<span class="badge-discount">${discount}</span>` : ''}
          ${deal ? `<span class="badge-deal">${deal}</span>` : ''}
        </div>
        <button class="btn btn-primary btn-lg" onclick="handleAddToCart('${product.id}')">Add to Cart</button>
        <a href="checkout.html" class="btn btn-outline btn-lg">Buy Now</a>
        <p class="product-desc">${product.description}</p>
        <h3>Highlights</h3>
        <ul class="feature-list">${product.features.map((f) => `<li>${f}</li>`).join('')}</ul>
      </div>
    </div>`;
}

function initDealsSection(containerId) {
  renderProductGrid(getDealsProducts(), containerId);
}

function initTrendingSection(containerId) {
  const trending = getTrendingProducts();
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = `<div class="scroll-row">${trending.map(renderProductCard).join('')}</div>`;
}
