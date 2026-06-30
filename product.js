// product.js — Tubby's Tumblerz Product Detail Page
// Reads slug from URL, fetches products.json, renders the product page

const PRODUCTS_URL = '/products.json';

// ── Get slug from URL ─────────────────────────────────────────
// URL format: /products/mandalorian → slug = "mandalorian"
// Fallback for local dev: /product.html?slug=mandalorian
function getSlugFromURL() {
    const path = window.location.pathname;
    const pathMatch = path.match(/\/products\/(.+)/);
    if (pathMatch) return decodeURIComponent(pathMatch[1].replace(/\/$/, ''));

    const params = new URLSearchParams(window.location.search);
    return params.get('slug');
}

// ── Fetch all products ────────────────────────────────────────
async function fetchProducts() {
    try {
        const resp = await fetch(PRODUCTS_URL);
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        return await resp.json();
    } catch (err) {
        console.error('Failed to load products:', err);
        return [];
    }
}

// ── Render Product Detail ─────────────────────────────────────
function renderProduct(product) {
    // Update page title
    document.title = `${product.name} | Tubby's Tumblerz`;

    // Update OG meta tags
    const ogTitle = document.getElementById('og-title');
    const ogDesc = document.getElementById('og-desc');
    const ogImage = document.getElementById('og-image');
    const ogUrl = document.getElementById('og-url');
    if (ogTitle) ogTitle.setAttribute('content', `${product.name} | Tubby's Tumblerz`);
    if (ogDesc) ogDesc.setAttribute('content', `Custom handcrafted ${product.name} tumbler. ${product.category}. Available now at Tubby's Tumblerz.`);
    if (ogImage) ogImage.setAttribute('content', `https://tubbystumblerz.com${product.image}`);
    if (ogUrl) ogUrl.setAttribute('content', `https://tubbystumblerz.com/products/${product.slug}`);

    // Update breadcrumb
    document.getElementById('breadcrumb-name').textContent = product.name;

    // Build highlights section (Etsy-style)
    const highlightsHTML = product.highlights && product.highlights.length > 0
        ? `<div class="product-detail-highlights">
              <h3>Item details</h3>
              <div class="highlights-grid">
                  ${product.highlights.map(h => `
                      <div class="highlight-row">
                          <span class="highlight-icon" aria-hidden="true">&#10003;</span>
                          <span class="highlight-label">${h.label}:</span>
                          <span class="highlight-value">${h.value}</span>
                      </div>
                  `).join('')}
              </div>
           </div>`
        : '';

    // Build description section
    const descriptionHTML = product.description
        ? `<div class="product-detail-description"><h3>Description</h3><p>${product.description}</p></div>`
        : '';

    // Build shipping & policies section (standard across all products)
    const shippingHTML = `
        <div class="product-detail-shipping-info">
            <h3>Shipping and return policies</h3>
            <div class="shipping-info-row">
                <span class="shipping-icon" aria-hidden="true">&#128230;</span>
                <span>Ships from New Jersey</span>
            </div>
            <div class="shipping-info-row">
                <span class="shipping-icon" aria-hidden="true">&#9201;</span>
                <span>Made to order. Prep time varies.</span>
            </div>
            <div class="shipping-info-row">
                <span class="shipping-icon" aria-hidden="true">&#128176;</span>
                <span>Shipping calculated at checkout</span>
            </div>
            <div class="shipping-info-row">
                <span class="shipping-icon" aria-hidden="true">&#128260;</span>
                <span>Returns accepted within 30 days</span>
            </div>
        </div>
    `;

    // Build the layout
    const container = document.getElementById('product-detail');
    container.className = 'product-detail-layout';
    container.innerHTML = `
        <div class="product-detail-image">
            <img src="${product.image}" alt="${product.name}" onerror="this.src='https://placehold.co/600x600?text=No+Image'">
        </div>
        <div class="product-detail-info">
            <span class="product-detail-category">${product.category}</span>
            <h1 class="product-detail-name">${product.name}</h1>
            <p class="product-detail-price">$${parseFloat(product.price).toFixed(2)}</p>
            <p class="product-detail-shipping">+ shipping (calculated at checkout)</p>
            <div class="product-detail-actions">
                <button class="btn btn-primary btn-large" id="add-to-cart-btn">Add to Cart</button>
            </div>
            <p class="product-detail-secure">Secure checkout powered by Stripe</p>
            ${highlightsHTML}
            ${descriptionHTML}
            ${shippingHTML}
        </div>
    `;

    // Wire up add to cart
    const addBtn = document.getElementById('add-to-cart-btn');
    addBtn.addEventListener('click', () => {
        Cart.addToCart(product);
    });
}

// ── Render Related Products ───────────────────────────────────
function renderRelated(allProducts, currentProduct) {
    // Find products in the same category, excluding the current one
    const related = allProducts.filter(p =>
        p.category === currentProduct.category && p.slug !== currentProduct.slug
    );

    if (related.length === 0) return;

    const section = document.getElementById('related-section');
    const grid = document.getElementById('related-products');

    section.style.display = 'block';
    grid.innerHTML = related.map(p => `
        <a href="/products/${p.slug}" class="related-product-card">
            <img src="${p.image}" alt="${p.name}" loading="lazy" onerror="this.src='https://placehold.co/300x300?text=No+Image'">
            <h3>${p.name}</h3>
            <p class="related-price">$${parseFloat(p.price).toFixed(2)}</p>
        </a>
    `).join('');
}

// ── Render Not Found ──────────────────────────────────────────
function renderNotFound() {
    document.title = 'Product Not Found | Tubby\'s Tumblerz';
    const container = document.getElementById('product-detail');
    container.className = '';
    container.innerHTML = `
        <div class="product-not-found">
            <h2>Product Not Found</h2>
            <p>Sorry, we couldn't find that product. It may have sold out or been removed.</p>
            <a href="/exclusive.html" class="btn btn-primary">Back to Inventory</a>
        </div>
    `;
}

// ── Init ─────────────────────────────────────────────────────
(async () => {
    const slug = getSlugFromURL();

    if (!slug) {
        renderNotFound();
        return;
    }

    const products = await fetchProducts();
    const product = products.find(p => p.slug === slug);

    if (!product) {
        renderNotFound();
        return;
    }

    renderProduct(product);
    renderRelated(products, product);
})();
