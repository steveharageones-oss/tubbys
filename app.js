// Fetch products from our secure Vercel API, which talks to Etsy
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

            // Clear the "Loading..." text
            productsContainer.innerHTML = '';

            // Loop through the results and create a card for each product
            data.results.forEach(product => {
                const productCard = document.createElement('div');
                productCard.className = 'product-card';
                
                // Get the first image, or use a placeholder if none exists
                const imageUrl = product.images && product.images.length > 0 
                    ? product.images[0].url_570xN 
                    : 'https://via.placeholder.com/300x300?text=No+Image';

                // Format the price
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
