document.addEventListener('DOMContentLoaded', () => {
    const grid = document.querySelector('#exclusive-products');
    const noResults = document.querySelector('#noResults');
    const paginationEl = document.querySelector('#pagination');
    const searchInput = document.querySelector('#searchInput');
    const searchClear = document.querySelector('#searchClear');
    const sheetId = '1tU05kkuOz2t3c7A4s_FeUIhn0P2oUHAPa-KX_jyFJw0';
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json`;

    const ITEMS_PER_PAGE = 8;
    let allProducts = [];
    let filteredProducts = [];
    let currentPage = 1;
    let activeCategory = 'all';
    let activeTheme = 'all';
    let searchQuery = '';

    // Type Filter Tabs
    const typeTabs = document.querySelectorAll('.tab-btn');
    typeTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            typeTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            activeCategory = tab.dataset.category;
            currentPage = 1;
            applyFilters();
        });
    });

    // Theme Filter Tabs (dynamically populated)
    const themeTabsContainer = document.querySelector('.theme-tabs');

    function buildThemeTabs(themes) {
        themeTabsContainer.innerHTML = '';
        const sortedThemes = themes.sort();

        // "All Themes" button
        const allBtn = document.createElement('button');
        allBtn.className = 'theme-btn' + (activeTheme === 'all' ? ' active' : '');
        allBtn.dataset.theme = 'all';
        allBtn.textContent = 'All Themes';
        allBtn.addEventListener('click', () => {
            document.querySelectorAll('.theme-btn').forEach(t => t.classList.remove('active'));
            allBtn.classList.add('active');
            activeTheme = 'all';
            currentPage = 1;
            applyFilters();
        });
        themeTabsContainer.appendChild(allBtn);

        sortedThemes.forEach(theme => {
            const btn = document.createElement('button');
            btn.className = 'theme-btn' + (activeTheme === theme ? ' active' : '');
            btn.dataset.theme = theme;
            btn.textContent = theme;
            btn.addEventListener('click', () => {
                document.querySelectorAll('.theme-btn').forEach(t => t.classList.remove('active'));
                btn.classList.add('active');
                activeTheme = theme;
                currentPage = 1;
                applyFilters();
            });
            themeTabsContainer.appendChild(btn);
        });
    }

    // Search
    searchInput.addEventListener('input', () => {
        searchQuery = searchInput.value.trim().toLowerCase();
        searchClear.style.display = searchQuery ? 'block' : 'none';
        currentPage = 1;
        applyFilters();
    });

    searchClear.addEventListener('click', () => {
        searchInput.value = '';
        searchQuery = '';
        searchClear.style.display = 'none';
        currentPage = 1;
        applyFilters();
    });

    function applyFilters() {
        filteredProducts = allProducts.filter(product => {
            const matchCategory = activeCategory === 'all' || product.category === activeCategory;
            const matchTheme = activeTheme === 'all' || product.themes.includes(activeTheme);
            const matchSearch = !searchQuery || 
                product.name.toLowerCase().includes(searchQuery) || 
                product.category.toLowerCase().includes(searchQuery) ||
                product.themes.some(t => t.toLowerCase().includes(searchQuery));
            return matchCategory && matchTheme && matchSearch;
        });

        updateTabCounts();
        renderProducts();
        renderPagination();
    }

    function renderProducts() {
        grid.innerHTML = '';

        if (filteredProducts.length === 0) {
            noResults.style.display = 'block';
            paginationEl.style.display = 'none';
            return;
        }

        noResults.style.display = 'none';
        paginationEl.style.display = 'flex';

        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        const end = start + ITEMS_PER_PAGE;
        const pageProducts = filteredProducts.slice(start, end);

        pageProducts.forEach(product => {
            const card = document.createElement('div');
            card.className = 'product-card';
            card.dataset.name = product.name;
            card.dataset.price = product.price;
            card.dataset.image = product.image;
            card.dataset.category = product.category;

            const primaryTheme = product.themes[0] || '';

            card.innerHTML = `
                <img src="${product.image}" alt="${product.name}" class="product-image" onerror="this.src='https://via.placeholder.com/300x300?text=No+Image'">
                <div class="product-info">
                    <span class="product-theme">${primaryTheme}</span>
                    <h3>${product.name}</h3>
                    <p class="price">$${product.price}</p>
                    <a href="index.html#custom-request" class="btn outline-btn">Request This</a>
                </div>
            `;
            grid.appendChild(card);
        });
    }

    function renderPagination() {
        paginationEl.innerHTML = '';

        if (filteredProducts.length <= ITEMS_PER_PAGE) {
            paginationEl.style.display = 'none';
            return;
        }

        paginationEl.style.display = 'flex';
        const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);

        // Previous button
        const prevBtn = document.createElement('button');
        prevBtn.className = 'page-btn' + (currentPage === 1 ? ' disabled' : '');
        prevBtn.innerHTML = '&laquo; Prev';
        prevBtn.disabled = currentPage === 1;
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderProducts();
                renderPagination();
                scrollToGrid();
            }
        });
        paginationEl.appendChild(prevBtn);

        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.className = 'page-btn' + (i === currentPage ? ' active' : '');
            pageBtn.textContent = i;
            pageBtn.addEventListener('click', () => {
                currentPage = i;
                renderProducts();
                renderPagination();
                scrollToGrid();
            });
            paginationEl.appendChild(pageBtn);
        }

        // Next button
        const nextBtn = document.createElement('button');
        nextBtn.className = 'page-btn' + (currentPage === totalPages ? ' disabled' : '');
        nextBtn.innerHTML = 'Next &raquo;';
        nextBtn.disabled = currentPage === totalPages;
        nextBtn.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                renderProducts();
                renderPagination();
                scrollToGrid();
            }
        });
        paginationEl.appendChild(nextBtn);
    }

    function scrollToGrid() {
        grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function updateTabCounts() {
        const allCount = allProducts.length;
        const tumblersCount = allProducts.filter(c => c.category === 'Tumblers').length;
        const toppersCount = allProducts.filter(c => c.category === 'Tumblers w/ Topper').length;

        typeTabs.forEach(tab => {
            const cat = tab.dataset.category;
            let count = allCount;
            if (cat === 'Tumblers') count = tumblersCount;
            else if (cat === 'Tumblers w/ Topper') count = toppersCount;
            tab.textContent = tab.textContent.replace(/ \(\d+\)$/, '') + ` (${count})`;
        });

        // Theme counts based on current type filter
        const themeCards = allProducts.filter(c => activeCategory === 'all' || c.category === activeCategory);
        const themeCounts = {};
        themeCards.forEach(c => {
            c.themes.forEach(theme => {
                themeCounts[theme] = (themeCounts[theme] || 0) + 1;
            });
        });

        document.querySelectorAll('.theme-btn').forEach(btn => {
            const theme = btn.dataset.theme;
            if (theme === 'all') {
                btn.textContent = 'All Themes';
            } else {
                const count = themeCounts[theme] || 0;
                btn.textContent = btn.textContent.replace(/ \(\d+\)$/, '') + ` (${count})`;
            }
        });
    }

    // Fetch products from Google Sheet
    fetch(url)
        .then(res => res.text())
        .then(text => {
            const jsonString = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
            const data = JSON.parse(jsonString);

            const rows = data.table.rows;
            if (!rows || rows.length === 0) {
                grid.innerHTML = '<p>No exclusive items right now. Check back soon!</p>';
                return;
            }

            const allThemes = new Set();

            rows.forEach((row) => {
                const colA = row.c[0]; // Name
                const colB = row.c[1]; // Price
                const colC = row.c[2]; // Image
                const colD = row.c[3]; // Category
                const colE = row.c[4]; // Theme (comma-separated)

                if (!colA || !colA.v) return;
                const name = colA.v;
                if (String(name).toLowerCase() === 'name') return;

                let price = colB && colB.v !== null ? colB.v : '0.00';
                if (typeof price === 'number') price = price.toFixed(2);
                else price = String(price).replace('$', '');

                const image = colC && colC.v ? colC.v : 'https://via.placeholder.com/300x300?text=No+Image';
                const category = colD && colD.v ? String(colD.v).trim() : 'Tumblers';
                const themeStr = colE && colE.v ? String(colE.v).trim() : '';
                const themes = themeStr ? themeStr.split(',').map(t => t.trim()).filter(t => t) : [];

                themes.forEach(t => allThemes.add(t));

                allProducts.push({ name, price, image, category, themes });
            });

            buildThemeTabs(allThemes);
            applyFilters();
        })
        .catch(err => {
            console.error('Error fetching Google Sheet:', err);
            grid.innerHTML = '<p style="color: red;">Failed to load inventory. Make sure the Google Sheet is public!</p>';
        });

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