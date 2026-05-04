// product.js — Tubby's Tumblerz Product Detail Page

const SHEET_ID = '1tU05kkuOz2t3c7A4s_FeUIhn0P2oUHAPa-KX_jyFJw0';
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json`;

function slugify(name) {
    return String(name)
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function formatPrice(price) {
    let p = price;
    if (typeof p === 'number') p = p.toFixed(2);
    else p = String(p).replace('$', '');
    return parseFloat(p).toFixed(2);
}

function getParam(name) {
    return new URLSearchParams(window.location.search).get(name);
}

async function loadAllProducts() {
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
            return { name, price, image, category, subcategory, slug: slugify(name) };
        }).filter(Boolean);
    } catch (err) {
        console.error('Failed to load inventory:', err);
        return [];
    }
}

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

function renderProduct(product) {
    document.title = `${product.name} | Tubby's Tumblerz`;
    document.getElementById('productHeroImg').src = product.image;
    document.getElementById('productHeroImg').alt = product.name;
    document.getElementById('productTitle').textContent = product.name;
    document.getElementById('productPrice').textContent = '$' + formatPrice(product.price);
    document.getElementById('productCategoryBadge').textContent = product.category;

    const subBadge = document.getElementById('productSubcategoryBadge');
    if (product.subcategory) {
        subBadge.textContent = product.subcategory;
    } else {
        subBadge.style.display = 'none';
    }

    document.getElementById('stickyPrice').textContent = '$' + formatPrice(product.price);

    const buyHandler = () => checkout(product);
    document.getElementById('buyNowBtn').addEventListener('click', buyHandler);
    document.getElementById('stickyBuyBtn').addEventListener('click', buyHandler);
}

(async () => {
    const slug = getParam('id');
    if (!slug) {
        document.querySelector('.product-info').innerHTML = '<p style="text-align:center;font-size:1.2rem;padding:40px 0;">Product not found.</p>';
        return;
    }

    let products = [];
    try {
        const cached = sessionStorage.getItem('tubbys_products');
        if (cached) products = JSON.parse(cached);
    } catch (e) {}

    if (!products || products.length === 0) {
        products = await loadAllProducts();
        try {
            sessionStorage.setItem('tubbys_products', JSON.stringify(products));
        } catch (e) {}
    }

    const product = products.find(p => p.slug === slug);
    if (!product) {
        document.querySelector('.product-info').innerHTML = '<p style="text-align:center;font-size:1.2rem;padding:40px 0;">Product not found.</p>';
        return;
    }

    renderProduct(product);
})();
