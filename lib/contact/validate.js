// Server-side validation & sanitization for the contact form.
// Mirrors the rules enforced client-side in assets/contact-form.js — the
// client checks exist for UX, this module is the source of truth because
// client-side checks can always be bypassed.

const ALLOWED_SERVICES = [
  'Biological Evaluation Plan (BEP)',
  'Biological Evaluation Report (BER)',
  'Chemical Characterization (CC)',
  'Toxicological Risk Assessment (TRA)',
  'Other Clinical & Regulatory Studies',
  'Not sure yet',
];

// Disallow carriage returns / line feeds and other control characters in
// single-line fields. Left unchecked, a newline in a field that ends up in
// an email header (e.g. a "from name") can be used for header injection.
const CONTROL_CHARS = /[\r\n\x00-\x08\x0B\x0C\x0E-\x1F]/;

// Same as above but without \r\n, since the message field is allowed to
// contain line breaks.
const CONTROL_CHARS_ALLOW_NEWLINES = /[\x00-\x08\x0B\x0C\x0E-\x1F]/;

const EMAIL_PATTERN =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

const NAME_PATTERN = /^[\p{L}\p{M} '.-]+$/u;
const PHONE_PATTERN = /^[0-9+\-() .]+$/;

function trimOrEmpty(value) {
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * Validates and sanitizes a raw contact form submission.
 * @param {Record<string, unknown>} body
 * @returns {{ isValid: boolean, isBot: boolean, errors: Record<string,string>, data: Record<string,string> }}
 */
function validateContactSubmission(body = {}) {
  const errors = {};
  const data = {};

  // Honeypot field: real visitors never see or fill this in (see contact.html).
  // If it has a value, the submission almost certainly came from a bot.
  const isBot = trimOrEmpty(body.website).length > 0;

  const fullName = trimOrEmpty(body.fullName);
  if (!fullName) {
    errors.fullName = 'Full name is required.';
  } else if (fullName.length < 2 || fullName.length > 100) {
    errors.fullName = 'Full name must be between 2 and 100 characters.';
  } else if (!NAME_PATTERN.test(fullName)) {
    errors.fullName = 'Full name contains characters that are not allowed.';
  } else {
    data.fullName = fullName;
  }

  const email = trimOrEmpty(body.email);
  if (!email) {
    errors.email = 'Email is required.';
  } else if (email.length > 254 || CONTROL_CHARS.test(email) || !EMAIL_PATTERN.test(email)) {
    errors.email = 'Enter a valid email address.';
  } else {
    data.email = email;
  }

  const company = trimOrEmpty(body.company);
  if (company.length > 150 || CONTROL_CHARS.test(company)) {
    errors.company = 'Company name is too long.';
  } else {
    data.company = company;
  }

  const phone = trimOrEmpty(body.phone);
  if (phone && (phone.length > 30 || !PHONE_PATTERN.test(phone))) {
    errors.phone = 'Enter a valid phone number.';
  } else {
    data.phone = phone;
  }

  const country = trimOrEmpty(body.country);
  if (country.length > 100 || CONTROL_CHARS.test(country)) {
    errors.country = 'Country / target market is too long.';
  } else {
    data.country = country;
  }

  const service = trimOrEmpty(body.service);
  if (service && !ALLOWED_SERVICES.includes(service)) {
    errors.service = 'Select a valid service from the list.';
  } else {
    data.service = service;
  }

  const subject = trimOrEmpty(body.subject);
  if (!subject) {
    errors.subject = 'Subject is required.';
  } else if (subject.length < 3 || subject.length > 150) {
    errors.subject = 'Subject must be between 3 and 150 characters.';
  } else if (CONTROL_CHARS.test(subject)) {
    errors.subject = 'Subject contains characters that are not allowed.';
  } else {
    data.subject = subject;
  }

  const message = trimOrEmpty(body.message);
  if (!message) {
    errors.message = 'Please tell us a bit about your inquiry.';
  } else if (message.length < 10 || message.length > 5000) {
    errors.message = 'Message must be between 10 and 5000 characters.';
  } else if (CONTROL_CHARS_ALLOW_NEWLINES.test(message)) {
    errors.message = 'Message contains characters that are not allowed.';
  } else {
    data.message = message;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    isBot,
    errors,
    data,
  };
}

module.exports = { validateContactSubmission, ALLOWED_SERVICES };
