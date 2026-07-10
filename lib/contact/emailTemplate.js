// Builds the HTML and plain-text bodies for the contact form notification
// email. Kept table-based with inline styles (no <style> block, no
// external CSS/classes) because that is what renders consistently across
// Outlook, Gmail, Apple Mail, and other common email clients.

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeMultiline(value = '') {
  return escapeHtml(value).replace(/\n/g, '<br>');
}

function buildRow(label, value) {
  if (!value) return '';
  return `
    <tr>
      <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;width:170px;vertical-align:top;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.04em;">${label}</td>
      <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;vertical-align:top;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#0f172a;">${value}</td>
    </tr>`;
}

/**
 * @param {object} data - sanitized, already-validated contact form fields
 * plus `submittedAt` and `sourceUrl` metadata.
 */
function buildContactEmailHtml(data) {
  const { fullName, email, company, phone, country, service, subject, message, submittedAt, sourceUrl } = data;

  const rows = [
    buildRow('Full Name', escapeHtml(fullName)),
    buildRow('Email', `<a href="mailto:${escapeHtml(email)}" style="color:#4f6ef7;text-decoration:none;">${escapeHtml(email)}</a>`),
    buildRow('Company', escapeHtml(company)),
    buildRow('Phone', escapeHtml(phone)),
    buildRow('Country / Target Market', escapeHtml(country)),
    buildRow('Service of Interest', escapeHtml(service)),
  ].join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>New Contact Form Submission</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
          <tr>
            <td style="background-color:#4f6ef7;padding:24px 32px;">
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.85);">Shiwatrix Lifesciences</p>
              <h1 style="margin:6px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:20px;color:#ffffff;">New Contact Form Submission</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 4px;">
              <p style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#64748b;margin:0;">Received ${escapeHtml(submittedAt)}</p>
              <p style="font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:700;color:#0f172a;margin:8px 0 0;">${escapeHtml(subject)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 16px 8px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                ${rows}
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 24px;">
              <p style="font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.04em;margin:16px 0 8px;">Message</p>
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#0f172a;background-color:#f8fafc;border:1px solid #e5e7eb;border-radius:8px;padding:16px;">${escapeMultiline(message)}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px;background-color:#f8fafc;border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#94a3b8;">Submitted via the contact form at ${escapeHtml(sourceUrl || 'shiwatrixlifesciences.com')}. Reply directly to this email to respond to ${escapeHtml(fullName)}.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildContactEmailText(data) {
  const { fullName, email, company, phone, country, service, subject, message, submittedAt, sourceUrl } = data;

  const lines = [
    'NEW CONTACT FORM SUBMISSION',
    '============================',
    `Received: ${submittedAt}`,
    '',
    `Full Name: ${fullName}`,
    `Email: ${email}`,
  ];
  if (company) lines.push(`Company: ${company}`);
  if (phone) lines.push(`Phone: ${phone}`);
  if (country) lines.push(`Country / Target Market: ${country}`);
  if (service) lines.push(`Service of Interest: ${service}`);
  lines.push(
    `Subject: ${subject}`,
    '',
    'Message:',
    '----------------------------------------',
    message,
    '----------------------------------------',
    '',
    `Submitted via the contact form at ${sourceUrl || 'shiwatrixlifesciences.com'}`
  );

  return lines.join('\n');
}

module.exports = { buildContactEmailHtml, buildContactEmailText, escapeHtml };
