/**
 * Contact form: client-side validation + fetch-based submission.
 *
 * This mirrors the validation rules enforced server-side in
 * lib/contact/validate.js. Client-side checks exist purely for UX (instant
 * feedback, no round trip); the server re-validates everything because
 * client-side checks can always be bypassed (disabled JS, direct API calls).
 */
(function () {
  const form = document.getElementById('contactForm');
  if (!form) return;

  const endpoint = form.dataset.endpoint || '/api/contact';
  const submitButton = form.querySelector('button[type="submit"]');
  const statusRegion = document.getElementById('formStatus');
  const successPanel = document.getElementById('formSuccess');
  const sendAnotherBtn = document.getElementById('sendAnotherBtn');

  if (sendAnotherBtn) {
    sendAnotherBtn.addEventListener('click', () => {
      form.reset();
      if (successPanel) successPanel.classList.add('hidden');
      form.classList.remove('hidden');
    });
  }

  const RULES = {
    fullName: { required: true, minLength: 2, maxLength: 100 },
    email: { required: true, maxLength: 254, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
    company: { required: false, maxLength: 150 },
    phone: { required: false, maxLength: 30, pattern: /^[0-9+\-() .]*$/ },
    country: { required: false, maxLength: 100 },
    subject: { required: true, minLength: 3, maxLength: 150 },
    message: { required: true, minLength: 10, maxLength: 5000 },
  };

  const MESSAGES = {
    fullName: { required: 'Full name is required.', minLength: 'Enter at least 2 characters.', maxLength: 'Keep it under 100 characters.' },
    email: { required: 'Email is required.', pattern: 'Enter a valid email address.', maxLength: 'That email address is too long.' },
    company: { maxLength: 'Keep it under 150 characters.' },
    phone: { pattern: 'Enter a valid phone number.', maxLength: 'That number looks too long.' },
    country: { maxLength: 'Keep it under 100 characters.' },
    subject: { required: 'Subject is required.', minLength: 'Enter at least 3 characters.', maxLength: 'Keep it under 150 characters.' },
    message: { required: 'Please tell us a bit about your inquiry.', minLength: 'Enter at least 10 characters.', maxLength: 'Keep it under 5000 characters.' },
  };

  function fieldError(name, rawValue) {
    const rule = RULES[name];
    if (!rule) return null;
    const value = (rawValue || '').trim();

    if (rule.required && !value) return MESSAGES[name].required;
    if (!value) return null; // optional and empty: nothing further to check
    if (rule.minLength && value.length < rule.minLength) return MESSAGES[name].minLength;
    if (rule.maxLength && value.length > rule.maxLength) return MESSAGES[name].maxLength;
    if (rule.pattern && !rule.pattern.test(value)) return MESSAGES[name].pattern;
    return null;
  }

  function showFieldError(name, message) {
    const input = form.elements[name];
    const errorEl = form.querySelector(`[data-error-for="${name}"]`);
    if (!input) return;

    if (message) {
      input.setAttribute('aria-invalid', 'true');
      input.classList.add('!border-red-500/60');
      if (errorEl) {
        errorEl.textContent = message;
        errorEl.classList.remove('hidden');
      }
    } else {
      input.removeAttribute('aria-invalid');
      input.classList.remove('!border-red-500/60');
      if (errorEl) {
        errorEl.textContent = '';
        errorEl.classList.add('hidden');
      }
    }
  }

  function validateForm() {
    let valid = true;
    let firstInvalidField = null;

    Object.keys(RULES).forEach((name) => {
      const input = form.elements[name];
      const message = fieldError(name, input ? input.value : '');
      showFieldError(name, message);
      if (message) {
        valid = false;
        firstInvalidField = firstInvalidField || input;
      }
    });

    if (firstInvalidField) firstInvalidField.focus();
    return valid;
  }

  // Validate on blur so mistakes surface before the user reaches "submit".
  Object.keys(RULES).forEach((name) => {
    const input = form.elements[name];
    if (!input) return;
    input.addEventListener('blur', () => showFieldError(name, fieldError(name, input.value)));
  });

  function setStatus(type, message) {
    if (!statusRegion) return;
    if (!message) {
      statusRegion.textContent = '';
      statusRegion.classList.add('hidden');
      return;
    }
    statusRegion.textContent = message;
    statusRegion.className = `text-sm mt-4 ${type === 'error' ? 'text-red-400' : 'text-slate-400'}`;
  }

  function setLoading(isLoading) {
    if (!submitButton) return;
    if (isLoading) {
      submitButton.dataset.originalLabel = submitButton.innerHTML;
      submitButton.innerHTML =
        '<svg class="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 11-9-9"/></svg> Sending&hellip;';
    } else if (submitButton.dataset.originalLabel) {
      submitButton.innerHTML = submitButton.dataset.originalLabel;
    }
    submitButton.disabled = isLoading;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    setStatus(null);

    // Honeypot: a filled-in decoy field means a bot submitted the form.
    // Reset quietly and stop — no need to hit the network or show an error.
    const honeypot = form.elements.website;
    if (honeypot && honeypot.value.trim()) {
      form.reset();
      return;
    }

    if (!validateForm()) {
      setStatus('error', 'Please fix the highlighted fields and try again.');
      return;
    }

    const payload = Object.fromEntries(new FormData(form).entries());

    setLoading(true);
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      let result = {};
      try {
        result = await response.json();
      } catch (_) {
        // Non-JSON response (e.g. a host platform's own error page) — fall
        // through to the generic error message below.
      }

      if (response.ok && result.success) {
        form.classList.add('hidden');
        if (successPanel) successPanel.classList.remove('hidden');
        return;
      }

      if (response.status === 400 && result.errors) {
        Object.entries(result.errors).forEach(([name, message]) => showFieldError(name, message));
        setStatus('error', 'Please fix the highlighted fields and try again.');
        return;
      }

      setStatus('error', result.message || 'Something went wrong. Please try again in a moment.');
    } catch (err) {
      setStatus('error', 'We could not reach the server. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  });
})();
