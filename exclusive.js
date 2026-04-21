// exclusive-inventory.js — Tubby's Tumblerz Exclusive Inventory Page

const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-171WFfIpQDon4x1MNb5dEKyO7dURtFxoGsR98xLR1SeX2FcR8O8OwkD3jYOyUbgNOo2g/pub?gid=0&single=true&output=csv';


// ── Fetch & Parse ──────────────────────────────────────────────
async function loadProducts() {
    try {
        const resp = await fetch(SHEET_URL);
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        const csv = await resp.text();
        return parseCSV(csv);
    } catch (err) {
        console.error('Failed to load inventory:', err);
        return [];
    }
}

function parseCSV(csv) {
    const lines = csv.split('\n').filter(l => l.trim());
    if (lines.length < 2) return [];

    return lines.slice(1).map(line => {
        const cols = line.match(/("[^"]*")|[^,]+/g) || [];
        const clean = cols.map(c => c.replace(/^"|"$/g, '').trim());
        return {
            name: clean[0] || 'Untitled',
            price: parseFloat(clean[1]) || 0,
            image: clean[2] || 'https://placehold.co/400x400?text=No+Image',
            category: clean[3] || 'Tumblers'
        };
    });
}


// ── Render ────────────────────────────────────────────────────
function renderProducts(products) {
    const grid = document.getElementById('exclusive-products');
    grid.innerHTML = '';

    if (!products.length) {
        grid.innerHTML = '<p style="text-align:center;color:var(--muted);">No items found.</p>';
        return;
    }

    products.forEach(p => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <img src="${p.image}" alt="${p.name}" loading="lazy">
            <h3>${p.name}</h3>
            <p class="product-price">$${p.price.toFixed(2)}</p>
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
            const filtered = cat === 'all'
                ? products
                : products.filter(p => p.category === cat);

            renderProducts(filtered);
        });
    });
}


// ── Product Modal ─────────────────────────────────────────────
function openModal(product) {
    const modal = document.getElementById('productModal');
    document.getElementById('modalImg').src = product.image;
    document.getElementById('modalTitle').textContent = product.name;
    document.getElementById('modalPrice').textContent = '$' + product.price.toFixed(2);

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
                price: product.price,
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
