document.addEventListener('DOMContentLoaded', () => {
    const grid = document.querySelector('#exclusive-products');
    
    // The spreadsheet ID from the link you provided
    const sheetId = '1tU05kkuOz2t3c7A4s_FeUIhn0P2oUHAPa-KX_jyFJw0';
    
    // Google's secret data visualization endpoint that spits out JSON
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json`;

    fetch(url)
        .then(res => res.text())
        .then(text => {
            // Clean up Google's weird wrapper to get pure JSON
            const jsonString = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
            const data = JSON.parse(jsonString);

            grid.innerHTML = ''; // Clear the loading text

            const rows = data.table.rows;
            
            if (!rows || rows.length === 0) {
                grid.innerHTML = '<p>No exclusive items right now. Check back soon!</p>';
                return;
            }

            rows.forEach((row) => {
                // The spreadsheet cells (Column A, B, C)
                const colA = row.c[0];
                const colB = row.c[1];
                const colC = row.c[2];

                if (!colA || !colA.v) return; // Skip completely empty rows

                const name = colA.v;
                // If the Title row got caught up in the data, skip it automatically
                if (String(name).toLowerCase() === 'name') return;

                // Format the price nicely even if she forgets decimal points
                let price = colB && colB.v !== null ? colB.v : '0.00';
                if (typeof price === 'number') {
                    price = price.toFixed(2);
                } else {
                    price = String(price).replace('$', '');
                }

                // Fallback image if she forgets to add a link
                const image = colC && colC.v ? colC.v : 'https://via.placeholder.com/300x300?text=No+Image';

                // Build the HTML card
                const card = document.createElement('div');
                card.className = 'product-card';
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
});
