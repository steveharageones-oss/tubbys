// exclusive-inventory.js — Tubby's Tumblerz Exclusive Inventory Page

const SHEET_ID = '1tU05kkuOz2t3c7A4s_FeUIhn0P2oUHAPa-KX_jyFJw0';
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json`;

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
            return { name, price, image, category };
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
            <img src="${p.image}" alt="${p.name}" class="product-image" loading="lazy" onerror="this.src='https://placehold.co/400x400?text=No+Image'">
            <h3>${p.name}</h3>
            <p class="product-price">$${parseFloat(p.price).toFixed(2)}</p>
            <span class="category-badge">${p.category}</span>
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
    buyBtn.onclick = () => checkout(product);
    modal.style.display = 'flex';
}

document.querySelector('.close-modal').addEventListener('click', () => {
    document.getElementById('productModal').style.display = 'none';
});

window.addEventListener('click', e => {
    if (e.target === document.getElementById('productModal')) {
        document.getElementById('productModal').style.display = 'none';
    }
});

// ── Stripe Checkout ───────────────────────────────────────────
async function checkout(product) {
    const btn = document.getElementById('buyNowBtn');
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
    renderProducts(products);
    setupTabs(products);
})();
