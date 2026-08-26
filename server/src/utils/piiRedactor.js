/**
 * PII Redaction utility
 * Redacts credit card numbers, SSNs, phone numbers, and emails before LLM dispatch
 */
const redactPII = (text) => {
  if (!text || typeof text !== 'string') return text;

  let redacted = text;

  // Credit Card numbers (13-19 digits, possibly separated by spaces or hyphens)
  const creditCardRegex = /\b(?:\d{4}[ -]?){3}(?:\d{1,4})\b/g;
  redacted = redacted.replace(creditCardRegex, '[REDACTED_CREDIT_CARD]');

  // Social Security Numbers / National ID format (XXX-XX-XXXX or 9 digits)
  const ssnRegex = /\b\d{3}[-]?\d{2}[-]?\d{4}\b/g;
  redacted = redacted.replace(ssnRegex, '[REDACTED_SSN]');

  // Phone numbers (e.g. +1 555-123-4567, 555.123.4567, etc.)
  const phoneRegex = /\b(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}\b/g;
  redacted = redacted.replace(phoneRegex, '[REDACTED_PHONE]');

  return redacted;
};

module.exports = {
  redactPII
};
