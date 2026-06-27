// cart.js — Tubby's Tumblerz Shopping Cart System
// localStorage-based cart with slide-out drawer and nav badge

const Cart = {
    STORAGE_KEY: 'tubbys_cart',

    // ── Core Cart Operations ──────────────────────────────────────
    getCart() {
        try {
            return JSON.parse(localStorage.getItem(this.STORAGE_KEY)) || [];
        } catch (e) {
            return [];
        }
    },

    saveCart(items) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
        this.updateBadge();
    },

    addToCart(product) {
        const cart = this.getCart();
        const existing = cart.find(item => item.name === product.name);
        if (existing) {
            existing.quantity += 1;
        } else {
            cart.push({
                name: product.name,
                price: parseFloat(product.price),
                image: product.image,
                quantity: 1
            });
        }
        this.saveCart(cart);
        this.openDrawer();
    },

    removeFromCart(name) {
        const cart = this.getCart().filter(item => item.name !== name);
        this.saveCart(cart);
        this.renderDrawer();
    },

    updateQuantity(name, delta) {
        const cart = this.getCart();
        const item = cart.find(i => i.name === name);
        if (item) {
            item.quantity += delta;
            if (item.quantity <= 0) {
                return this.removeFromCart(name);
            }
            this.saveCart(cart);
            this.renderDrawer();
        }
    },

    clearCart() {
        localStorage.removeItem(this.STORAGE_KEY);
        this.updateBadge();
        this.renderDrawer();
    },

    getCartTotal() {
        return this.getCart().reduce((sum, item) => sum + (item.price * item.quantity), 0);
    },

    getItemCount() {
        return this.getCart().reduce((sum, item) => sum + item.quantity, 0);
    },

    // ── Nav Badge ─────────────────────────────────────────────────
    updateBadge() {
        const badge = document.getElementById('cart-badge');
        if (!badge) return;
        const count = this.getItemCount();
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
    },

    // ── Drawer Open/Close ─────────────────────────────────────────
    openDrawer() {
        const drawer = document.getElementById('cart-drawer');
        const overlay = document.getElementById('cart-overlay');
        if (drawer) drawer.classList.add('open');
        if (overlay) overlay.classList.add('show');
        this.renderDrawer();
    },

    closeDrawer() {
        const drawer = document.getElementById('cart-drawer');
        const overlay = document.getElementById('cart-overlay');
        if (drawer) drawer.classList.remove('open');
        if (overlay) overlay.classList.remove('show');
    },

    // ── Render Drawer Contents ────────────────────────────────────
    renderDrawer() {
        const itemsContainer = document.getElementById('cart-items');
        const subtotalEl = document.getElementById('cart-subtotal');
        const checkoutBtn = document.getElementById('cart-checkout-btn');
        if (!itemsContainer) return;

        const cart = this.getCart();

        if (cart.length === 0) {
            itemsContainer.innerHTML = '<p class="cart-empty">Your cart is empty</p>';
            if (subtotalEl) subtotalEl.textContent = '$0.00';
            if (checkoutBtn) checkoutBtn.style.display = 'none';
            return;
        }

        if (checkoutBtn) checkoutBtn.style.display = 'block';

        itemsContainer.innerHTML = cart.map(item => `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.name}" class="cart-item-img" onerror="this.src='https://placehold.co/80x80?text=No+Image'">
                <div class="cart-item-details">
                    <p class="cart-item-name">${item.name.length > 40 ? item.name.substring(0, 40) + '...' : item.name}</p>
                    <p class="cart-item-price">$${item.price.toFixed(2)}</p>
                    <div class="cart-qty-controls">
                        <button onclick="Cart.updateQuantity('${this.escapeName(item.name)}', -1)" aria-label="Decrease quantity">&minus;</button>
                        <span class="cart-qty">${item.quantity}</span>
                        <button onclick="Cart.updateQuantity('${this.escapeName(item.name)}', 1)" aria-label="Increase quantity">&plus;</button>
                    </div>
                </div>
                <button class="cart-item-remove" onclick="Cart.removeFromCart('${this.escapeName(item.name)}')" aria-label="Remove item">&times;</button>
            </div>
        `).join('');

        if (subtotalEl) {
            subtotalEl.textContent = '$' + this.getCartTotal().toFixed(2);
        }
    },

    escapeName(name) {
        return name.replace(/'/g, "\\'").replace(/"/g, '&quot;');
    },

    // ── Initialize ─────────────────────────────────────────────────
    init() {
        this.updateBadge();

        // Close drawer on overlay click
        const overlay = document.getElementById('cart-overlay');
        if (overlay) {
            overlay.addEventListener('click', () => this.closeDrawer());
        }

        // Close drawer button
        const closeBtn = document.getElementById('cart-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeDrawer());
        }

        // Cart icon click opens drawer
        const cartIcon = document.getElementById('cart-icon');
        if (cartIcon) {
            cartIcon.addEventListener('click', (e) => {
                e.preventDefault();
                this.openDrawer();
            });
        }

        // Checkout button
        const checkoutBtn = document.getElementById('cart-checkout-btn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => {
                if (this.getCart().length === 0) return;
                this.closeDrawer();
                window.location.href = 'checkout.html';
            });
        }
    }
};

// Initialize on every page load
document.addEventListener('DOMContentLoaded', () => Cart.init());
