// Vercel Serverless Function to securely fetch Etsy products
export default async function handler(req, res) {
    const ETSY_API_KEY = process.env.ETSY_API_KEY;
    const SHOP_NAME = "tubbystumblerz";
    
    if (!ETSY_API_KEY) {
        return res.status(500).json({ error: "Etsy API key not configured in Vercel. Add ETSY_API_KEY in Vercel Environment Variables." });
    }

    try {
        // Step 1: Get the numeric Shop ID
        const shopResponse = await fetch(`https://openapi.etsy.com/v3/application/shops?shop_name=${SHOP_NAME}`, {
            headers: { 'x-api-key': ETSY_API_KEY }
        });
        const shopData = await shopResponse.json();
        if (!shopData.results || shopData.results.length === 0) {
            return res.status(500).json({ error: `Could not find Etsy shop with name: ${SHOP_NAME}` });
        }
        const numericShopId = shopData.results[0].shop_id;

        // Step 2: Fetch active listings (limit to 12 so we don't timeout fetching images)
        const response = await fetch(`https://openapi.etsy.com/v3/application/shops/${numericShopId}/listings/active?includes=Images&limit=12`, {
            headers: { 'x-api-key': ETSY_API_KEY }
        });
        const data = await response.json();

        // Step 3: BRUTE FORCE IMAGES - If Etsy ignores includes=Images, we fetch them one by one
        if (data.results) {
            const imagePromises = data.results.map(async (item) => {
                // If it already has images (unlikely based on our diagnostics), skip
                if (item.images || item.Images) return item;
                
                try {
                    // Explicitly ask for this specific listing's images
                    const imgRes = await fetch(`https://openapi.etsy.com/v3/application/listings/${item.listing_id}/images`, {
                        headers: { 'x-api-key': ETSY_API_KEY }
                    });
                    const imgData = await imgRes.json();
                    if (imgData.results) {
                        item.images = imgData.results;
                    }
                } catch (e) {
                    console.error("Fallback image fetch failed for", item.listing_id);
                }
                return item;
            });
            
            // Wait for all image fetches to finish
            data.results = await Promise.all(imagePromises);
        }

        res.status(200).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch Etsy data: " + error.message });
    }
}
