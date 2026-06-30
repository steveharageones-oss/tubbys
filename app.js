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
                let imageUrl = 'https://placehold.co/300x300/90E0EF/005A9C?text=No+Image';

                if (imageArray && imageArray.length > 0) {
                    const imgObj = imageArray[0];
                    imageUrl = imgObj.url_570xN || imgObj.url_fullxfull || imgObj.url_170x135 || imageUrl;
                }

                const price = product.price ? (product.price.amount / product.price.divisor).toFixed(2) : '0.00';

                productCard.innerHTML = `
                    <img src="${imageUrl}" alt="${product.title}" class="product-image"
                         onerror="this.onerror=null; this.src='https://placehold.co/300x300/90E0EF/005A9C?text=No+Image';">
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
});
