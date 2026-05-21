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

        // Step 3: BRUTE FORCE IMAGES - If Etsy ignores includes=Images, fetch per listing
        if (data.results) {
            const imagePromises = data.results.map(async (item) => {
                const hasImages = (item.images && Array.isArray(item.images) && item.images.length > 0)
                               || (item.Images && Array.isArray(item.Images) && item.Images.length > 0);
                if (hasImages) return item;

                try {
                    const controller = new AbortController();
                    const timeout = setTimeout(() => controller.abort(), 3000);
                    const imgRes = await fetch(
                        `https://openapi.etsy.com/v3/application/listings/${item.listing_id}/images`,
                        { headers: { 'x-api-key': ETSY_API_KEY }, signal: controller.signal }
                    );
                    clearTimeout(timeout);
                    if (!imgRes.ok) {
                        console.error(`Image fetch HTTP ${imgRes.status} for listing ${item.listing_id}`);
                        return item;
                    }
                    const imgData = await imgRes.json();
                    if (imgData.results && imgData.results.length > 0) {
                        item.images = imgData.results;
                    } else {
                        console.error(`No images returned for listing ${item.listing_id}`);
                    }
                } catch (e) {
                    console.error("Fallback image fetch failed for", item.listing_id, e.message);
                }
                return item;
            });

            data.results = await Promise.all(imagePromises);
        }

        res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
        res.status(200).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch Etsy data: " + error.message });
    }
}
