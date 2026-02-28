import fetch from "node-fetch";

const ETSY_API_KEY = process.env.ETSY_API_KEY;
const SHOP_NAME = "TubbysTumblerz";

export default async function handler(req, res) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (req.method === "OPTIONS") {
    return res.status(200).headers(headers).send("");
  }

  try {
    const authHeaders = {
      "Authorization": `Bearer ${ETSY_API_KEY}`,
      "Accept": "application/json"
    };

    const shopResp = await fetch(
      `https://openapi.etsy.com/v3/application/shops/${SHOP_NAME}`,
      { headers: authHeaders }
    );

    if (!shopResp.ok) {
      const errText = await shopResp.text();
      return res.status(shopResp.status).headers(headers).json({
        error: "Failed to fetch shop info",
        detail: errText
      });
    }

    const shop = await shopResp.json();
    const shopId = shop.shop_id;

    const listingsResp = await fetch(
      `https://openapi.etsy.com/v3/application/shops/${shopId}/listings/active?limit=25&includes=images`,
      { headers: authHeaders }
    );

    if (!listingsResp.ok) {
      const errText = await listingsResp.text();
      return res.status(listingsResp.status).headers(headers).json({
        error: "Failed to fetch listings",
        detail: errText
      });
    }

    const listings = await listingsResp.json();

    const products = listings.results.map((item) => {
      const price = item.price || {};
      const amount = price.amount && price.divisor
        ? (price.amount / price.divisor).toFixed(2)
        : "0.00";
      const currency = price.currency_code || "USD";
      const images = item.images || [];
      const imageUrl = images.length > 0 ? images[0].url_570xN : "";
      const allImages = images.map((img) => img.url_570xN);

      return {
        id: item.listing_id,
        title: item.title,
        description: item.description ? item.description.substring(0, 200) : "",
        price: amount,
        currency: currency,
        url: item.url,
        image: imageUrl,
        images: allImages,
        tags: item.tags || [],
        quantity: item.quantity || 0,
      };
    });

    return res.status(200).headers(headers).json({
      shop: {
        name: shop.shop_name,
        title: shop.title,
        url: shop.url,
        icon_url: shop.icon_url_fullxfull,
        listing_count: shop.listing_active_count,
      },
      products: products,
    });
  } catch (err) {
    return res.status(500).headers(headers).json({
      error: "Server error",
      detail: err.message
    });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
