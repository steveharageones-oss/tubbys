// Fetch products from our secure Vercel API, which talks to Etsy
document.addEventListener('DOMContentLoaded', () => {
    const productsContainer = document.getElementById('etsy-products');
    
    async function loadProducts() {
        try {
            const response = await fetch('/api/etsy');
            const data = await response.json();
            
            if (data.error) {
                if (productsContainer) productsContainer.innerHTML = `<p style="color: red;">Setup required: ${data.error}</p>`;
                return;
            }

            if (!data.results || data.results.length === 0) {
                if (productsContainer) productsContainer.innerHTML = '<p>No products found right now. Check back soon!</p>';
                return;
            }

            if (productsContainer) productsContainer.innerHTML = '';

            data.results.forEach(product => {
                const productCard = document.createElement('div');
                productCard.className = 'product-card';
                
                const imageArray = product.images || product.Images;
                let imageUrl = 'https://via.placeholder.com/300x300?text=No+Image';

                if (imageArray && imageArray.length > 0) {
                    const imgObj = imageArray[0];
                    imageUrl = imgObj.url_570xN || imgObj.url_fullxfull || imgObj.url_170x135 || imageUrl;
                }

                const price = product.price ? (product.price.amount / product.price.divisor).toFixed(2) : '0.00';

                productCard.innerHTML = `
                    <img src="${imageUrl}" alt="${product.title}" class="product-image">
                    <h3>${product.title.substring(0, 50)}...</h3>
                    <p class="price">$${price}</p>
                    <a href="${product.url}" target="_blank" class="btn outline-btn">View on Etsy</a>
                `;
                if (productsContainer) productsContainer.appendChild(productCard);
            });
        } catch (error) {
            console.error('Error loading products:', error);
            if (productsContainer) productsContainer.innerHTML = '<p>Failed to load products. Please try again later.</p>';
        }
    }

    if (productsContainer) {
        loadProducts();
    }

    // --- DYNAMIC AD FROM GOOGLE SHEETS ---
    const adImg = document.getElementById('dynamic-ad-img');
    const sheetId = '1tU05kkuOz2t3c7A4s_FeUIhn0P2oUHAPa-KX_jyFJw0';
    const adUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=Ads`;

    if (adImg) {
        fetch(adUrl)
            .then(res => res.text())
            .then(text => {
                const jsonString = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
                const data = JSON.parse(jsonString);
                if (data.table && data.table.rows && data.table.rows.length > 0) {
                    let validLinks = [];

                    // Collect all valid image links from the Ads sheet
                    data.table.rows.forEach(row => {
                        if (row.c && row.c[0] && row.c[0].v) {
                            const link = row.c[0].v;
                            if (!link.toLowerCase().includes('ad link') && link.startsWith('http')) {
                                validLinks.push(link);
                            }
                        }
                    });

                    if (validLinks.length > 0) {
                        let currentIndex = 0;
                        adImg.src = validLinks[currentIndex]; // Set the first image immediately

                        // If there is more than 1 ad, start the slideshow loop
                        if (validLinks.length > 1) {
                            // Preload images into browser memory so transitions are smooth
                            validLinks.forEach(url => { const img = new Image(); img.src = url; });

                            setInterval(() => {
                                adImg.classList.add('fade'); // Start fade out
                                setTimeout(() => {
                                    currentIndex = (currentIndex + 1) % validLinks.length;
                                    adImg.src = validLinks[currentIndex]; // Swap image
                                    adImg.classList.remove('fade'); // Fade back in
                                }, 500); // 500ms matches the CSS transition time
                            }, 5000); // Switch every 5 seconds
                        }
                    }
                }
            })
            .catch(err => console.log('No Ads tab found yet.'));
    }
});
