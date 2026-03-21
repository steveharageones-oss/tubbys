document.addEventListener('DOMContentLoaded', () => {
    const productsContainer = document.getElementById('etsy-products');
    
    async function loadProducts() {
        try {
            const response = await fetch('/api/etsy');
            const data = await response.json();
            
            if (data.error) {
                productsContainer.innerHTML = `<p style="color: red;">Setup required: ${data.error}</p>`;
                return;
            }

            if (!data.results || data.results.length === 0) {
                productsContainer.innerHTML = '<p>No products found right now. Check back soon!</p>';
                return;
            }

            // --- DIAGNOSTIC TOOL --- 
            // We will print the exact raw JSON of the very first product to the screen so we can see where Etsy is putting the images.
            const firstProduct = data.results[0];
            const debugBox = document.createElement('div');
            debugBox.style.backgroundColor = '#111';
            debugBox.style.color = '#0f0';
            debugBox.style.padding = '15px';
            debugBox.style.marginBottom = '30px';
            debugBox.style.borderRadius = '5px';
            debugBox.style.textAlign = 'left';
            debugBox.style.fontSize = '12px';
            debugBox.style.fontFamily = 'monospace';
            debugBox.style.overflowX = 'auto';
            debugBox.innerHTML = `<strong>Diagnostic Data (Please copy & paste this to Agent Zero):</strong><br><br>${JSON.stringify(firstProduct, null, 2).replace(/\n/g, '<br>').replace(/ /g, '&nbsp;')}`;
            
            // Insert diagnostic box before the products
            productsContainer.parentNode.insertBefore(debugBox, productsContainer);
            // -----------------------

            productsContainer.innerHTML = '';

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
                productsContainer.appendChild(productCard);
            });
        } catch (error) {
            console.error('Error loading products:', error);
            productsContainer.innerHTML = '<p>Failed to load products. Please try again later.</p>';
        }
    }

    loadProducts();
});
