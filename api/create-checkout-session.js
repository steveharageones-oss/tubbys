// Vercel Serverless Function - Stripe Checkout Session
// Creates a Checkout Session for a single tumbler purchase

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { name, price, image } = req.body;

        // Validate required fields
        if (!name || !price) {
            return res.status(400).json({ error: 'Missing product name or price' });
        }

        // Determine the base URL for success/cancel redirects
        const baseUrl = process.env.FRONTEND_URL || `https://${req.headers.host}`;

        // Create a Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: name,
                            images: image ? [image] : [],
                        },
                        unit_amount: Math.round(parseFloat(price) * 100), // Convert dollars to cents
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment', // One-time payment, not subscription
            success_url: `${baseUrl}/success.html?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${baseUrl}/exclusive.html`,
        });

        // Return the session URL so the frontend can redirect
        res.status(200).json({ url: session.url });
    } catch (error) {
        console.error('Stripe checkout error:', error);
        res.status(500).json({ error: 'Failed to create checkout session: ' + error.message });
    }
}
