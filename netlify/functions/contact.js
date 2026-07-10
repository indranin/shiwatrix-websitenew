// Netlify Functions entry point: POST /.netlify/functions/contact
// (netlify.toml redirects /api/contact to this function, so the frontend
// can always call /api/contact regardless of which platform is hosting it.)

const { handleContactSubmission } = require('../../lib/contact/sendContactEmail');

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ success: false, message: 'Method not allowed.' }) };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const result = await handleContactSubmission({
      body,
      sourceUrl: event.headers.referer,
    });
    return { statusCode: result.status, headers, body: JSON.stringify(result.payload) };
  } catch (err) {
    console.error('Unexpected error handling contact submission:', err);
    return { statusCode: 400, headers, body: JSON.stringify({ success: false, message: 'Invalid request.' }) };
  }
};
