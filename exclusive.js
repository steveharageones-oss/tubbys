// exclusive.js — Tubby's Tumblerz Exclusive Inventory Page
// Now reads from local products.json instead of Google Sheets

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
        card.innerHTML = `
            <img src="${p.image}" alt="${p.name}" class="product-image" loading="lazy" onerror="this.src='https://placehold.co/400x400?text=No+Image'">
            <h3>${p.name}</h3>
            <p class="product-price">$${parseFloat(p.price).toFixed(2)}</p>
            <p class="shipping-note">+ shipping</p>
        `;
        card.addEventListener('click', () => openModal(p));
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

// ── Product Modal ─────────────────────────────────────────────
function openModal(product) {
    const modal = document.getElementById('productModal');
    document.getElementById('modalImg').src = product.image;
    document.getElementById('modalTitle').textContent = product.name;
    document.getElementById('modalPrice').textContent = '$' + parseFloat(product.price).toFixed(2);
    const buyBtn = document.getElementById('buyNowBtn');
    buyBtn.textContent = 'Add to Cart';
    buyBtn.onclick = () => addToCart(product);
    modal.classList.add('show');
}

function addToCart(product) {
    Cart.addToCart(product);
    // Close the product modal
    document.getElementById('productModal').classList.remove('show');
    // Cart drawer opens automatically via Cart.addToCart()
}

document.querySelector('.close-modal').addEventListener('click', () => {
    document.getElementById('productModal').classList.remove('show');
});

window.addEventListener('click', e => {
    if (e.target === document.getElementById('productModal')) {
        document.getElementById('productModal').classList.remove('show');
    }
});

// ── Init ─────────────────────────────────────────────────────
(async () => {
    const products = await loadProducts();
    renderProducts(products);
    setupTabs(products);
})();
