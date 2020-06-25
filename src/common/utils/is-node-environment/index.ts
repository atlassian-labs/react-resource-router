/**
 * @see https://github.com/jsdom/jsdom/releases/tag/12.0.0
 * @see https://github.com/jsdom/jsdom/issues/1537
 */
const isJsDomEnvironment = () =>
  window.name === 'nodejs' ||
  navigator.userAgent.includes('Node.js') ||
  navigator.userAgent.includes('jsdom');

export const isNodeEnvironment = () => {
  if (typeof window === 'undefined') {
    return true;
  }

  if (isJsDomEnvironment()) {
    return true;
  }

  return false;
};
