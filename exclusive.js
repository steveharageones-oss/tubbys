document.addEventListener('DOMContentLoaded', () => {
    const grid = document.querySelector('#exclusive-products');
    const sheetId = '1tU05kkuOz2t3c7A4s_FeUIhn0P2oUHAPa-KX_jyFJw0';
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json`;

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
                const colA = row.c[0];
                const colB = row.c[1];
                const colC = row.c[2];

                if (!colA || !colA.v) return; 
                const name = colA.v;
                if (String(name).toLowerCase() === 'name') return;

                let price = colB && colB.v !== null ? colB.v : '0.00';
                if (typeof price === 'number') price = price.toFixed(2);
                else price = String(price).replace('$', '');

                const image = colC && colC.v ? colC.v : 'https://via.placeholder.com/300x300?text=No+Image';

                const card = document.createElement('div');
                card.className = 'product-card';
                card.dataset.name = name;
                card.dataset.price = price;
                card.dataset.image = image;
                
                card.innerHTML = `
                    <img src="${image}" alt="${name}" class="product-image" onerror="this.src='https://via.placeholder.com/300x300?text=No+Image'">
                    <h3>${name}</h3>
                    <p class="price">$${price}</p>
                    <a href="index.html#custom-request" class="btn outline-btn">Request This</a>
                `;
                grid.appendChild(card);
            });
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

    if (grid && modal && modalImg && modalTitle && modalPrice && closeModal) {
        grid.addEventListener('click', function(e) {
            const card = e.target.closest('.product-card');
            if (card) {
                modalImg.src = card.dataset.image;
                modalTitle.textContent = card.dataset.name;
                modalPrice.textContent = '$' + card.dataset.price;
                
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
    }
});
