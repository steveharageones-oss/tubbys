// checkout.js — Tubby's Tumblerz Checkout Page
// Handles Stripe Payment Element integration with on-site checkout

let stripe = null;
let elements = null;
let paymentElement = null;
let currentTotal = 0;

document.addEventListener('DOMContentLoaded', async () => {
    const cart = Cart.getCart();

    // If cart is empty, show empty state
    if (cart.length === 0) {
        document.getElementById('checkout-content').style.display = 'none';
        document.getElementById('empty-cart-msg').style.display = 'block';
        return;
    }

    // Render order summary from cart
    renderOrderSummary(cart);

    // Initialize Stripe with publishable key
    // We'll fetch it from our backend to avoid hardcoding
    try {
        const total = Cart.getCartTotal() + 13.00; // subtotal + shipping
        currentTotal = total;

        // Create PaymentIntent via serverless function
        const response = await fetch('/api/create-payment-intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                items: cart,
                shippingAddress: {
                    name: document.getElementById('ship-name').value || 'pending',
                    email: document.getElementById('ship-email').value || 'pending',
                    address: document.getElementById('ship-address').value || 'pending',
                    city: document.getElementById('ship-city').value || 'pending',
                    state: document.getElementById('ship-state').value || 'pending',
                    zip: document.getElementById('ship-zip').value || 'pending',
                }
            })
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || 'Failed to create payment intent');
        }

        const data = await response.json();
        currentTotal = parseFloat(data.total);

        // Initialize Stripe — fetch publishable key from our config endpoint
        const configResp = await fetch('/api/config');
        const configData = await configResp.json();
        if (!configData.publishableKey) {
            throw new Error('Stripe publishable key not configured');
        }
        stripe = Stripe(configData.publishableKey);

        elements = stripe.elements({
            clientSecret: data.clientSecret,
            appearance: {
                theme: 'stripe',
                variables: {
                    colorPrimary: '#005A9C',
                    colorBackground: '#ffffff',
                    colorText: '#001F3F',
                    colorDanger: '#df1b41',
                    fontFamily: 'Quicksand, sans-serif',
                    borderRadius: '12px',
                    spacingUnit: '12px',
                }
            }
        });

        // Create and mount the Payment Element
        paymentElement = elements.create('payment');
        paymentElement.mount('#payment-element');

        // Clear loading placeholder
        document.getElementById('payment-element').innerHTML = '';

        // Enable pay button and update amount
        const payBtn = document.getElementById('pay-button');
        payBtn.disabled = false;
        updatePayButtonText();

        // Handle form submission
        payBtn.addEventListener('click', handlePayment);

    } catch (error) {
        console.error('Checkout init error:', error);
        document.getElementById('payment-element').innerHTML =
            `<div class="payment-error" style="display:block;">Could not load payment form: ${error.message}</div>`;
    }
});

// ── Helper Functions ──────────────────────────────────────────

function renderOrderSummary(cart) {
    const itemsContainer = document.getElementById('order-items');
    const subtotalEl = document.getElementById('summary-subtotal');
    const totalEl = document.getElementById('summary-total');

    itemsContainer.innerHTML = cart.map(item => `
        <div class="order-item">
            <div class="order-item-info">
                <span class="order-item-qty">${item.quantity}x</span>
                <span class="order-item-name">${item.name.length > 35 ? item.name.substring(0, 35) + '...' : item.name}</span>
            </div>
            <span class="order-item-price">$${(item.price * item.quantity).toFixed(2)}</span>
        </div>
    `).join('');

    const subtotal = Cart.getCartTotal();
    subtotalEl.textContent = '$' + subtotal.toFixed(2);
    totalEl.textContent = '$' + (subtotal + 13.00).toFixed(2);
}

function updatePayButtonText() {
    document.getElementById('pay-button-text').textContent = 'Pay $' + currentTotal.toFixed(2);
}

async function handlePayment(event) {
    event.preventDefault();

    const payBtn = document.getElementById('pay-button');
    const payBtnText = document.getElementById('pay-button-text');
    const errorEl = document.getElementById('payment-error');
    errorEl.style.display = 'none';
    errorEl.textContent = '';

    // Validate shipping form
    const shippingForm = document.getElementById('shipping-form');
    if (!shippingForm.checkValidity()) {
        shippingForm.reportValidity();
        return;
    }

    payBtn.disabled = true;
    payBtnText.textContent = 'Processing...';

    try {
        // Confirm payment with Stripe
        const result = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: window.location.origin + '/success.html?pi_id={PAYMENT_INTENT_ID}',
                payment_method_data: {
                    billing_details: {
                        name: document.getElementById('ship-name').value,
                        email: document.getElementById('ship-email').value,
                        address: {
                            line1: document.getElementById('ship-address').value,
                            city: document.getElementById('ship-city').value,
                            state: document.getElementById('ship-state').value,
                            postal_code: document.getElementById('ship-zip').value,
                            country: 'US',
                        }
                    }
                }
            }
        });

        // If there's an error, show it
        if (result.error) {
            errorEl.textContent = result.error.message;
            errorEl.style.display = 'block';
            payBtn.disabled = false;
            updatePayButtonText();
        }
        // If successful, Stripe redirects to return_url automatically
    } catch (error) {
        console.error('Payment error:', error);
        errorEl.textContent = 'Payment failed: ' + error.message;
        errorEl.style.display = 'block';
        payBtn.disabled = false;
        updatePayButtonText();
    }
}
