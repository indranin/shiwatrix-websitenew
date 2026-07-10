# Contact Form — Setup & Deployment

The contact form on `contact.html` submits to a serverless function
(`POST /api/contact`) that validates the submission and emails it to the
team. There is no traditional server — this works on any static host that
supports serverless functions (Vercel, Netlify; adaptable to AWS
Lambda/Cloudflare Workers with a thin wrapper around
`lib/contact/sendContactEmail.js`).

## How it fits together

```
contact.html            → form markup, honeypot field, inline error slots
assets/contact-form.js  → client-side validation + fetch("/api/contact")
api/contact.js          → Vercel function entry point
netlify/functions/contact.js → Netlify function entry point
netlify.toml            → redirects /api/* → /.netlify/functions/* so the
                          frontend can always call /api/contact
lib/contact/validate.js       → server-side validation & sanitization (source of truth)
lib/contact/emailTemplate.js  → HTML + plain-text email body builders
lib/contact/sendContactEmail.js → ties validation + template + nodemailer together
```

Both platform entry points call the same `handleContactSubmission()` core
function, so validation and email logic only exist in one place.

## 1. Install dependencies

```bash
npm install
```

This installs `nodemailer`, the only runtime dependency the function needs.

## 2. Configure environment variables

Copy `.env.example` to `.env` for local testing:

```bash
cp .env.example .env
```

Then fill in:

| Variable | Purpose |
|---|---|
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS` | Your SMTP provider credentials. Works with Gmail (App Password), Microsoft 365, SendGrid, Mailgun, Amazon SES, etc. |
| `CONTACT_TO_EMAIL` | The mailbox that should receive submissions. |
| `CONTACT_FROM_EMAIL` | Optional "from" address (defaults to `SMTP_USER`). |
| `ALLOWED_ORIGIN` | Your production domain, to restrict CORS. |

**Never commit `.env`.** It's already excluded via `.gitignore`. In production,
set the same variables in your host's dashboard (Vercel → Project → Settings
→ Environment Variables; Netlify → Site → Environment variables) — the
frontend never sees these values, since they're only read inside the
serverless function at request time.

## 3. Deploy

- **Vercel**: push the repo and import it — `api/contact.js` is picked up
  automatically as a serverless function at `/api/contact`.
- **Netlify**: push the repo and import it — `netlify.toml` points Netlify at
  `netlify/functions` and redirects `/api/contact` to the function, so no
  frontend changes are needed either way.

## 4. Test it

Submit the form on `/contact.html` with valid data and confirm the email
arrives, formatted per `lib/contact/emailTemplate.js`. Then try:
- Submitting with a required field empty → inline error under that field.
- Submitting an invalid email → inline error, no request sent until fixed.
- Filling the hidden `website` field via devtools and submitting → server
  returns `success: true` but no email is sent (honeypot working as intended).

## Security notes

- **Credentials never reach the browser.** SMTP credentials live only in
  environment variables read by the serverless function.
- **Server-side validation is authoritative.** `lib/contact/validate.js`
  re-checks every field regardless of what the client sent — required
  fields, length limits, email format, and an allowlist for the "Service of
  Interest" dropdown. Client-side checks in `assets/contact-form.js` exist
  only to give immediate feedback; they do not protect the server.
- **Header injection is blocked.** Single-line fields reject `\r`/`\n` and
  other control characters, so a submission can't smuggle extra email
  headers (e.g. an injected `Bcc:`) through the `replyTo`/`subject` fields.
- **HTML injection into the email body is blocked.** Every value is
  HTML-escaped in `emailTemplate.js` before being interpolated into the
  email, so a message containing `<script>` or `<img onerror=...>` renders
  as inert text rather than executing in the recipient's email client.
- **Basic bot filtering via honeypot.** A field that's invisible to real
  users (`website` in `contact.html`) is a very effective, zero-friction way
  to filter the bulk of automated spam without a CAPTCHA.
- **CORS is restricted** via `ALLOWED_ORIGIN` once you set it to your real
  domain — do this before going to production, or any site could call your
  endpoint and use it to relay email.
- **Rate limiting is not implemented here** — serverless functions are
  stateless, so an in-memory counter wouldn't actually work across
  invocations. For production abuse protection, add your host's built-in
  rate limiting/bot protection, or a service like Cloudflare Turnstile /
  hCaptcha in front of the form if spam becomes a problem.
