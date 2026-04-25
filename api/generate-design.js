// /api/generate-design.js
// Venice API image generation using Grok Imagine

export default async function handler(req, res) {
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

    const response = await fetch('https://api.venice.ai/api/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.VENICE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'grok-imagine-image',
        prompt: enhancedPrompt,
        aspect_ratio: '1:1',
        resolution: '2k',
        n: 1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Venice image API error:', errorText);
      return res.status(500).json({ error: 'Failed to generate image' });
    }

    const data = await response.json();
    
    // Venice returns data.data[0].url (OpenAI-compatible format)
    const imageUrl = data.data?.[0]?.url;
    
    if (!imageUrl) {
      console.error('No image URL in response:', JSON.stringify(data));
      return res.status(500).json({ error: 'No image generated' });
    }

    res.status(200).json({
      imageUrl: imageUrl,
      prompt: prompt,
    });
  } catch (error) {
    console.error('Generate design error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
