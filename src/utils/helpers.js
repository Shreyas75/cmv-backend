/**
 * Sanitize input string by trimming whitespace.
 * @param {any} input - The input to sanitize.
 * @returns {any} - The trimmed string if input is a string, otherwise the original input.
 */
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  return input.trim();
}

module.exports = {
  sanitizeInput,
};
