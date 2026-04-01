// Vercel Serverless Function for PhotoRoom Background Removal
// Endpoint: POST /api/remove-bg
// Body: { image: "data:image/png;base64,..." }

const PHOTOROOM_API_KEY = 'sandbox_sk_pr_default_2651f93d0fe0138587bf319ecd49952df572679d';
const PHOTOROOM_URL = 'https://sdk.photoroom.com/v1/segment';
const FormData = require('form-data');

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Read request body
    let body = '';
    await new Promise((resolve, reject) => {
      req.on('data', chunk => body += chunk);
      req.on('end', resolve);
      req.on('error', reject);
    });

    const { image } = JSON.parse(body || '{}');

    if (!image) {
      return res.status(400).json({ error: 'No image provided' });
    }

    // Convert base64 to buffer
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // Build form data for PhotoRoom
    const form = new FormData();
    form.append('image', imageBuffer, {
      filename: 'upload.png',
      contentType: 'image/png',
    });

    // Call PhotoRoom API
    const response = await fetch(PHOTOROOM_URL, {
      method: 'POST',
      headers: {
        'x-api-key': PHOTOROOM_API_KEY,
        ...form.getHeaders(),
      },
      body: form,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('PhotoRoom API error:', response.status, errorText);
      return res.status(response.status).json({ 
        error: 'Background removal failed',
        details: errorText.substring(0, 300)
      });
    }

    // Get result image
    const resultBuffer = await response.arrayBuffer();
    const resultBase64 = Buffer.from(resultBuffer).toString('base64');

    return res.status(200).json({
      success: true,
      image: `data:image/png;base64,${resultBase64}`,
    });

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
};
