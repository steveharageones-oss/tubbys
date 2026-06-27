// Vercel Serverless Function - Stripe Payment Intent
// Creates a PaymentIntent for cart-based checkout (no redirect)

const SHIPPING_FLAT_RATE = 13.00; // Adjust to match Stripe shipping rate

export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { items, shippingAddress } = req.body;

        // Validate cart items
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Cart is empty' });
        }

        // Calculate total server-side (never trust frontend totals)
        let subtotal = 0;
        for (const item of items) {
            if (!item.name || !item.price || !item.quantity) {
                return res.status(400).json({ error: 'Invalid item in cart' });
            }
            subtotal += parseFloat(item.price) * parseInt(item.quantity);
        }

        const shipping = SHIPPING_FLAT_RATE;
        const total = subtotal + shipping;
        const totalCents = Math.round(total * 100);

        // Build line item description for Stripe metadata
        const itemSummary = items.map(i => `${i.name} x${i.quantity}`).join(', ');

        // Initialize Stripe
        const Stripe = require('stripe');
        const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

        // Create PaymentIntent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: totalCents,
            currency: 'usd',
            automatic_payment_methods: { enabled: true },
            metadata: {
                items: itemSummary.substring(0, 500), // Stripe metadata has limits
                item_count: items.reduce((sum, i) => sum + i.quantity, 0).toString(),
                shipping_address: shippingAddress ? JSON.stringify(shippingAddress).substring(0, 500) : 'pending',
            },
        });

        // Return client secret and total for the frontend
        res.status(200).json({
            clientSecret: paymentIntent.client_secret,
            total: total.toFixed(2),
            subtotal: subtotal.toFixed(2),
            shipping: shipping.toFixed(2),
        });
    } catch (error) {
        console.error('PaymentIntent error:', error);
        res.status(500).json({ error: 'Failed to create payment intent: ' + error.message });
    }
}
