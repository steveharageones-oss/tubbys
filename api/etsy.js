// Vercel Serverless Function to securely fetch Etsy products
export default async function handler(req, res) {
    const ETSY_API_KEY = process.env.ETSY_API_KEY;
    const SHOP_ID = "tubbystumblerz"; // Update this if your shop ID is different
    
    if (!ETSY_API_KEY) {
        return res.status(500).json({ error: "Etsy API key not configured in Vercel" });
    }

    try {
        // Fetch active listings from Etsy v3 API
        const response = await fetch(`https://openapi.etsy.com/v3/application/shops/${SHOP_ID}/listings/active?includes=Images`, {
            headers: {
                'x-api-key': ETSY_API_KEY
            }
        });
        
        const data = await response.json();
        res.status(200).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch Etsy data" });
    }
}
