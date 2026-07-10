// Core, platform-agnostic handler for a contact form submission. Both the
// Vercel entry point (api/contact.js) and the Netlify entry point
// (netlify/functions/contact.js) call this same function, so validation,
// sanitization, and email sending only need to be implemented once.

const nodemailer = require('nodemailer');
const { validateContactSubmission } = require('./validate');
const { buildContactEmailHtml, buildContactEmailText } = require('./emailTemplate');

let cachedTransporter = null;

// Credentials are read from environment variables only, at request time —
// never hard-code SMTP credentials in source, and never send them to the
// browser. See .env.example for the variables this expects.
function getTransporter() {
  if (cachedTransporter) return cachedTransporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    throw new Error('Email transport is not configured (missing SMTP_HOST, SMTP_USER, or SMTP_PASS).');
  }

  cachedTransporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: SMTP_SECURE === 'true', // true for port 465, false for 587/STARTTLS
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  return cachedTransporter;
}

/**
 * @param {object} params
 * @param {object} params.body - parsed JSON body from the request
 * @param {string} [params.sourceUrl] - referring page, for the email footer
 * @returns {Promise<{status: number, payload: object}>}
 */
async function handleContactSubmission({ body, sourceUrl }) {
  const { isValid, isBot, errors, data } = validateContactSubmission(body);

  if (isBot) {
    // Don't reveal to automated submitters that a honeypot caught them —
    // report success and silently drop the message.
    return { status: 200, payload: { success: true } };
  }

  if (!isValid) {
    return { status: 400, payload: { success: false, errors } };
  }

  const toAddress = process.env.CONTACT_TO_EMAIL;
  if (!toAddress) {
    console.error('CONTACT_TO_EMAIL is not configured.');
    return {
      status: 500,
      payload: { success: false, message: 'The server is not configured to receive messages right now.' },
    };
  }

  const submittedAt = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
  const emailData = { ...data, submittedAt, sourceUrl };
  const fromAddress = process.env.CONTACT_FROM_EMAIL || process.env.SMTP_USER;

  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      to: toAddress,
      from: `"Shiwatrix Website" <${fromAddress}>`,
      replyTo: `"${data.fullName}" <${data.email}>`,
      subject: `[Website Contact] ${data.subject}`,
      html: buildContactEmailHtml(emailData),
      text: buildContactEmailText(emailData),
    });
    return { status: 200, payload: { success: true } };
  } catch (err) {
    console.error('Failed to send contact email:', err);
    return {
      status: 500,
      payload: { success: false, message: 'We could not send your message right now. Please try again shortly.' },
    };
  }
}

module.exports = { handleContactSubmission };
