document.addEventListener('DOMContentLoaded', () => {
    const grid = document.querySelector('#exclusive-products');
    const sheetId = '1tU05kkuOz2t3c7A4s_FeUIhn0P2oUHAPa-KX_jyFJw0';
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json`;

    let activeCategory = 'all';

    // Category Tab Logic
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            activeCategory = tab.dataset.category;
            filterProducts();
        });
    });

    function filterProducts() {
        const cards = grid.querySelectorAll('.product-card');
        cards.forEach(card => {
            if (activeCategory === 'all' || card.dataset.category === activeCategory) {
                card.style.display = '';
            } else {
                card.style.display = 'none';
            }
        });
    }

    fetch(url)
        .then(res => res.text())
        .then(text => {
            const jsonString = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
            const data = JSON.parse(jsonString);
            grid.innerHTML = ''; 

            const rows = data.table.rows;
            if (!rows || rows.length === 0) {
                grid.innerHTML = '<p>No exclusive items right now. Check back soon!</p>';
                return;
            }

            rows.forEach((row) => {
                const colA = row.c[0]; // Name
                const colB = row.c[1]; // Price
                const colC = row.c[2]; // Image
                const colD = row.c[3]; // Category

                if (!colA || !colA.v) return; 
                const name = colA.v;
                if (String(name).toLowerCase() === 'name') return;

                let price = colB && colB.v !== null ? colB.v : '0.00';
                if (typeof price === 'number') price = price.toFixed(2);
                else price = String(price).replace('$', '');

                const image = colC && colC.v ? colC.v : 'https://via.placeholder.com/300x300?text=No+Image';
                const category = colD && colD.v ? String(colD.v).trim() : 'Tumblers';

                const card = document.createElement('div');
                card.className = 'product-card';
                card.dataset.name = name;
                card.dataset.price = price;
                card.dataset.image = image;
                card.dataset.category = category;
                
                card.innerHTML = `
                    <img src="${image}" alt="${name}" class="product-image" onerror="this.src='https://via.placeholder.com/300x300?text=No+Image'">
                    <h3>${name}</h3>
                    <p class="price">$${price}</p>
                    <a href="index.html#custom-request" class="btn outline-btn">Request This</a>
                `;
                grid.appendChild(card);
            });

            updateTabCounts();
        })
        .catch(err => {
            console.error('Error fetching Google Sheet:', err);
            grid.innerHTML = '<p style="color: red;">Failed to load inventory. Make sure the Google Sheet is public!</p>';
        });

    function updateTabCounts() {
        const cards = grid.querySelectorAll('.product-card');
        const allCount = cards.length;
        const tumblersCount = [...cards].filter(c => c.dataset.category === 'Tumblers').length;
        const toppersCount = [...cards].filter(c => c.dataset.category === 'Tumblers w/ Topper').length;

        tabs.forEach(tab => {
            const cat = tab.dataset.category;
            let count = allCount;
            if (cat === 'Tumblers') count = tumblersCount;
            else if (cat === 'Tumblers w/ Topper') count = toppersCount;
            tab.textContent = tab.textContent.replace(/ \(\d+\)$/, '') + ` (${count})`;
        });
    }

    // Modal Logic
    const modal = document.getElementById('productModal');
    const modalImg = document.getElementById('modalImg');
    const modalTitle = document.getElementById('modalTitle');
    const modalPrice = document.getElementById('modalPrice');
    const closeModal = document.querySelector('.close-modal');
    const buyNowBtn = document.getElementById('buyNowBtn');

    if (grid && modal && modalImg && modalTitle && modalPrice && closeModal) {
        grid.addEventListener('click', function(e) {
            const card = e.target.closest('.product-card');
            if (card) {
                modalImg.src = card.dataset.image;
                modalImg.alt = card.dataset.name;
                modalTitle.textContent = card.dataset.name;
                modalPrice.textContent = '$' + card.dataset.price;

                // Store product data for checkout
                buyNowBtn.dataset.name = card.dataset.name;
                buyNowBtn.dataset.price = card.dataset.price;
                buyNowBtn.dataset.image = card.dataset.image;
                
                modal.style.display = 'block';
                setTimeout(() => modal.classList.add('show'), 10);
            }
        });

        const hideModal = () => {
            modal.classList.remove('show');
            setTimeout(() => modal.style.display = 'none', 300);
        };

        closeModal.addEventListener('click', hideModal);
        modal.addEventListener('click', function(e) {
            if (e.target === modal) hideModal();
        });

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && modal.classList.contains('show')) hideModal();
        });
    }

    // Stripe Checkout Logic
    if (buyNowBtn) {
        buyNowBtn.addEventListener('click', async function() {
            const name = this.dataset.name;
            const price = this.dataset.price;
            const image = this.dataset.image;

            // Disable button to prevent double clicks
            buyNowBtn.disabled = true;
            buyNowBtn.textContent = 'Processing...';

            try {
                const response = await fetch('/api/create-checkout-session', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, price, image })
                });

                const data = await response.json();

                if (data.url) {
                    // Redirect to Stripe Checkout
                    window.location = data.url;
                } else {
                    alert('Something went wrong. Please try again.');
                    buyNowBtn.disabled = false;
                    buyNowBtn.textContent = 'Buy Now';
                }
            } catch (error) {
                console.error('Checkout error:', error);
                alert('Unable to start checkout. Please try again.');
                buyNowBtn.disabled = false;
                buyNowBtn.textContent = 'Buy Now';
            }
        });
    }
});
