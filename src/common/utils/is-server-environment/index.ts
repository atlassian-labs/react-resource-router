/**
 * @see https://github.com/jsdom/jsdom/releases/tag/12.0.0
 * @see https://github.com/jsdom/jsdom/issues/1537
 */
const isJsDomEnvironment = () =>
  window.name === 'nodejs' ||
  navigator.userAgent.includes('Node.js') ||
  navigator.userAgent.includes('jsdom');

export const isServerEnvironment = () => {
  if (
    typeof process !== 'undefined' &&
    process.versions != null &&
    process.versions.node != null
  ) {
    return true;
  }

  if (isJsDomEnvironment()) {
    return true;
  }

  return false;
};
