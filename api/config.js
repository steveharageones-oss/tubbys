// Vercel Serverless Function - Returns Stripe publishable key
// The publishable key is safe to expose to the frontend (that's its purpose)

export default async function handler(req, res) {
    res.status(200).json({
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || ''
    });
}
