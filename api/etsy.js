// Vercel Serverless Function to securely fetch Etsy products
export default async function handler(req, res) {
    const ETSY_API_KEY = process.env.ETSY_API_KEY;
    const SHOP_NAME = "tubbystumblerz"; // The string name of your shop
    
    if (!ETSY_API_KEY) {
        return res.status(500).json({ error: "Etsy API key not configured in Vercel. Add ETSY_API_KEY in Vercel Environment Variables." });
    }

    try {
        // Step 1: Get the numeric Shop ID using the Shop Name
        const shopResponse = await fetch(`https://openapi.etsy.com/v3/application/shops?shop_name=${SHOP_NAME}`, {
            headers: {
                'x-api-key': ETSY_API_KEY
            }
        });
        
        const shopData = await shopResponse.json();
        
        if (!shopData.results || shopData.results.length === 0) {
            return res.status(500).json({ error: `Could not find Etsy shop with name: ${SHOP_NAME}` });
        }

        const numericShopId = shopData.results[0].shop_id;

        // Step 2: Fetch active listings using the numeric Shop ID
        const response = await fetch(`https://openapi.etsy.com/v3/application/shops/${numericShopId}/listings/active?includes=Images`, {
            headers: {
                'x-api-key': ETSY_API_KEY
            }
        });
        
        const data = await response.json();
        res.status(200).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch Etsy data: " + error.message });
    }
}
