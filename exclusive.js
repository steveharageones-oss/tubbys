// exclusive.js — Tubby's Tumblerz Exclusive Inventory Page
// Reads from local products.json, links to product detail pages

const PRODUCTS_URL = '/products.json';

// ── Fetch & Parse ──────────────────────────────────────────────
async function loadProducts() {
    try {
        const resp = await fetch(PRODUCTS_URL);
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        const products = await resp.json();
        if (!products || products.length === 0) return [];
        return products;
    } catch (err) {
        console.error('Failed to load inventory:', err);
        return [];
    }
}

// ── Render ────────────────────────────────────────────────────
function renderProducts(products) {
    const grid = document.getElementById('exclusive-products');
    grid.innerHTML = '';
    if (!products.length) {
        grid.innerHTML = '<p style="text-align:center;color:var(--muted);font-size:1.1rem;">No items found.</p>';
        return;
    }
    products.forEach(p => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.style.cursor = 'pointer';
        card.innerHTML = `
            <img src="${p.image}" alt="${p.name}" class="product-image" loading="lazy" onerror="this.src='https://placehold.co/400x400?text=No+Image'">
            <h3>${p.name}</h3>
            <p class="product-price">$${parseFloat(p.price).toFixed(2)}</p>
            <p class="shipping-note">+ shipping</p>
        `;
        // Navigate to product detail page on click
        card.addEventListener('click', () => {
            window.location.href = `/products/${p.slug}`;
        });
        grid.appendChild(card);
    });
}

// ── Filter Tabs ──────────────────────────────────────────────
function setupTabs(products) {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const cat = tab.dataset.category;
            const filtered = cat === 'all' ? products : products.filter(p => p.category === cat);
            renderProducts(filtered);
        });
    });
}

// ── Init ─────────────────────────────────────────────────────
(async () => {
    const products = await loadProducts();
    renderProducts(products);
    setupTabs(products);
})();
