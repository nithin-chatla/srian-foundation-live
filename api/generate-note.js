// This is a secure serverless function that acts as a "middleman".
// It will run on a server, not in the user's browser.

export default async function handler(req, res) {
  // 1. We only accept POST requests to this function.
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 2. Get the prompt from the website's request.
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  // 3. Securely get your secret API key from the server's environment variables.
  //    This key is NEVER exposed to the public.
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
  
  const payload = {
      contents: [{ parts: [{ text: prompt }] }],
  };

  try {
    // 4. Call the Google AI API from the secure server.
    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error("Google AI API Error:", errorData);
        throw new Error('Failed to generate content from Google AI.');
    }

    const result = await response.json();
    
    // 5. Send the generated text back to your website.
    if (result.candidates && result.candidates.length > 0) {
        const text = result.candidates[0].content.parts[0].text;
        res.status(200).json({ text: text });
    } else {
        throw new Error("No content generated.");
    }

  } catch (error) {
    console.error('Internal Server Error:', error);
    res.status(500).json({ error: error.message });
  }
}