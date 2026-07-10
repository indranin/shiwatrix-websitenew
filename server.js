// Express server for the Shiwatrix Lifesciences website.
//
// Serves the static site from /public and handles POST /api/contact
// in-process, reusing the same validation/email logic that also backs the
// Vercel and Netlify serverless adapters in api/ and netlify/functions/.

require('dotenv').config();

const path = require('path');
const express = require('express');
const { handleContactSubmission } = require('./lib/contact/sendContactEmail');

const app = express();
const PORT = process.env.PORT || 3000;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/contact', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  try {
    const result = await handleContactSubmission({
      body: req.body || {},
      sourceUrl: req.headers.referer,
    });
    res.status(result.status).json(result.payload);
  } catch (err) {
    console.error('Unexpected error handling contact submission:', err);
    res.status(400).json({ success: false, message: 'Invalid request.' });
  }
});

app.use((req, res) => {
  res.status(404).type('text').send('404 Not Found');
});

app.listen(PORT, () => {
  console.log(`Shiwatrix Lifesciences website running at http://localhost:${PORT}`);
});
