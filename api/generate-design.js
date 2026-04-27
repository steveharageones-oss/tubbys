// /api/generate-design.js
// Venice API image generation using Grok Imagine

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
    // Enhance prompt for photorealistic 3D tumbler mockup
    const enhancedPrompt = `Photorealistic 3D mockup of a 20oz stainless steel tumbler with a custom wrap-around design printed on it, studio lighting, white background, product photography style, high detail, centered composition. Design theme: ${prompt}`;

    const response = await fetch('https://api.venice.ai/api/v1/image/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.VENICE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'grok-imagine-image',   // Grok Imagine via Venice
        prompt: enhancedPrompt,
        width: 1024,
        height: 1024,
        steps: 30,
        hide_watermark: true,
        return_binary: false           // returns base64
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Venice image API error:', response.status, errorText);
      return res.status(500).json({ error: 'Failed to generate image' });
    }

    const data = await response.json();
    
    // Venice returns { images: [ base64_image_string ] }
    let imageBase64 = data.images?.[0];
    
    if (!imageBase64) {
      console.error('No image data in response:', JSON.stringify(data).substring(0, 200));
      return res.status(500).json({ error: 'No image generated' });
    }

    // Prepend data URI if needed
    const imageUrl = imageBase64.startsWith('data:') ? imageBase64 : `data:image/png;base64,${imageBase64}`;

    res.status(200).json({
      imageUrl: imageUrl,
      prompt: prompt,
    });
  } catch (error) {
    console.error('Generate design error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
