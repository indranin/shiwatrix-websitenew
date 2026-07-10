// Vercel serverless function entry point: POST /api/contact
// Deploying this file at api/contact.js is all Vercel needs to expose it —
// no extra configuration required.

const { handleContactSubmission } = require('../lib/contact/sendContactEmail');

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method not allowed.' });
    return;
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const result = await handleContactSubmission({
      body,
      sourceUrl: req.headers.referer,
    });
    res.status(result.status).json(result.payload);
  } catch (err) {
    console.error('Unexpected error handling contact submission:', err);
    res.status(400).json({ success: false, message: 'Invalid request.' });
  }
};
