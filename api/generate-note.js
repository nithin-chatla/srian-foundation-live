// This is the updated secure serverless function with added logging.
// This will help us see exactly what's happening on the Vercel server.

export default async function handler(req, res) {
  // Log that the function was triggered
  console.log("generate-note function started.");

  if (req.method !== 'POST') {
    console.error("Error: Method was not POST.");
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { prompt } = req.body;
  console.log("Received prompt:", prompt);

  if (!prompt) {
    console.error("Error: Prompt was not received in the request body.");
    return res.status(400).json({ error: 'Prompt is required' });
  }

  // Check if the API key is available on the server
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("CRITICAL ERROR: GEMINI_API_KEY environment variable is not set on Vercel!");
    return res.status(500).json({ error: 'API key not configured on the server.' });
  }
  console.log("GEMINI_API_KEY has been found."); // Security: Don't log the key itself

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
  
  const payload = {
      contents: [{ parts: [{ text: prompt }] }],
  };

  try {
    console.log("Sending request to Google AI API...");
    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error("Google AI API returned an error:", errorData);
        throw new Error('Failed to get a valid response from Google AI.');
    }

    const result = await response.json();
    
    if (result.candidates && result.candidates.length > 0) {
        const text = result.candidates[0].content.parts[0].text;
        console.log("Successfully received AI-generated text.");
        res.status(200).json({ text: text });
    } else {
        console.error("Error: Google AI response did not contain any candidates.", result);
        throw new Error("No content generated.");
    }

  } catch (error) {
    console.error('Internal Server Error:', error.message);
    res.status(500).json({ error: error.message });
  }
}

