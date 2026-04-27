// exclusive-inventory.js — Tubby's Tumblerz Exclusive Inventory Page

const SHEET_ID = '1tU05kkuOz2t3c7A4s_FeUIhn0P2oUHAPa-KX_jyFJw0';
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json`;
let allProducts = [];
let activeCategory = 'all';
let activeSubcategory = '';
// ── Fetch & Parse ──────────────────────────────────────────────
async function loadProducts() {
    try {
        const resp = await fetch(SHEET_URL);
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        const text = await resp.text();
        const jsonString = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
        const data = JSON.parse(jsonString);
        const rows = data.table.rows;
        if (!rows || rows.length === 0) return [];
        return rows.filter(row => row.c[0] && row.c[0].v).map(row => {
            const name = String(row.c[0].v).trim();
            if (name.toLowerCase() === 'name') return null;
            let price = row.c[1] && row.c[1].v !== null ? row.c[1].v : '0.00';
            if (typeof price === 'number') price = price.toFixed(2);
            else price = String(price).replace('$', '');
            const image = row.c[2] && row.c[2].v ? row.c[2].v : 'https://placehold.co/400x400?text=No+Image';
            const category = row.c[3] && row.c[3].v ? String(row.c[3].v).trim() : 'Tumblers';
            const subcategory = row.c[4] && row.c[4].v ? String(row.c[4].v).trim() : '';
            return { name, price, image, category, subcategory };
        }).filter(Boolean);
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
            <div class="product-image-wrapper">
                <img src="${p.image}" alt="${p.name}" class="product-image" loading="lazy" onerror="this.src='https://placehold.co/400x400?text=No+Image'">
                <div class="hover-overlay">
                    <button class="btn btn-primary hover-buy-btn">Buy Now</button>
                </div>
            </div>
            <h3>${p.name}</h3>
            <p class="product-price">$${parseFloat(p.price).toFixed(2)}</p>
        `;
        card.querySelector('.hover-buy-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            checkout(p, e.currentTarget);
        });
        card.querySelector('.product-image-wrapper').addEventListener('click', (e) => {
            if (e.target.closest('.hover-buy-btn')) return; // don't open modal from hover button
            openModal(p);
        });
        grid.appendChild(card);
    });
}

// ── Filter Tabs ──────────────────────────────────────────────
function setupTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            activeCategory = tab.dataset.category;
            applyFilters();
        });
    });
}

function applyFilters() {
    let filtered = allProducts;
    if (activeCategory !== 'all') {
        filtered = filtered.filter(p => p.category === activeCategory);
    }
    if (activeSubcategory !== '') {
        filtered = filtered.filter(p => p.subcategory === activeSubcategory);
    }
    renderProducts(filtered);
}

function setupSubcategoryDropdown(products) {
    const dropdown = document.getElementById('subcategory-dropdown');
    if (!dropdown) return;
    const subcategories = [...new Set(products.map(p => p.subcategory).filter(Boolean))].sort();
    dropdown.innerHTML = '<option value="">All Themes</option>' +
        subcategories.map(s => `<option value="${s}">${s}</option>`).join('');
    dropdown.addEventListener('change', () => {
        activeSubcategory = dropdown.value;
        applyFilters();
    });
}

// ── Product Modal ─────────────────────────────────────────────
function openModal(product) {
    const modal = document.getElementById('productModal');
    document.getElementById('modalImg').src = product.image;
    document.getElementById('modalTitle').textContent = product.name;
    document.getElementById('modalPrice').textContent = '$' + parseFloat(product.price).toFixed(2);
    const buyBtn = document.getElementById('buyNowBtn');
    buyBtn.onclick = () => checkout(product);
    modal.classList.add('show');
}

document.querySelector('.close-modal').addEventListener('click', () => {
    document.getElementById('productModal').classList.remove('show');
});

window.addEventListener('click', e => {
    if (e.target === document.getElementById('productModal')) {
        document.getElementById('productModal').classList.remove('show');
    }
});

// ── Stripe Checkout ───────────────────────────────────────────
async function checkout(product, btnEl = null) {
    const btn = btnEl || document.getElementById('buyNowBtn');
    if (!btn) return;
    btn.textContent = 'Processing…';
    btn.disabled = true;
    try {
        const resp = await fetch('/api/create-checkout-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: product.name,
                price: parseFloat(product.price),
                image: product.image
            })
        });
        if (!resp.ok) throw new Error('Checkout failed');
        const data = await resp.json();
        window.location = data.url;
    } catch (err) {
        alert('Checkout error — please try again.');
        console.error(err);
        btn.textContent = 'Buy Now';
        btn.disabled = false;
    }
}

// ── Init ─────────────────────────────────────────────────────
(async () => {
    const products = await loadProducts();
    allProducts = products;
    setupTabs();
    setupSubcategoryDropdown(products);
    applyFilters();
})();
