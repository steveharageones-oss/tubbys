// /api/chat.js
// Venice API chat endpoint using Grok 4.1

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messages array required' });
  }

  try {
    const response = await fetch('https://api.venice.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.VENICE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'grok-4-1',
        messages: [
          {
            role: 'system',
            content: `You are a friendly, creative tumbler designer for Tubby's Tumblerz — a boutique custom tumbler shop. You help customers design unique 20oz tumblers.

Your job:
- Ask engaging questions about their theme, colors, characters, patterns, and style preferences
- Keep responses concise and fun (2-3 sentences max)
- Suggest creative ideas if they're unsure
- When they've described their vision, confirm the details and let them know they can click "Generate Design" to see it

Do NOT generate the image yourself — just chat and help refine the idea.`
          },
          ...messages
        ],
        temperature: 0.8,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Venice API error:', errorText);
      return res.status(500).json({ error: 'Failed to get response from AI designer' });
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
