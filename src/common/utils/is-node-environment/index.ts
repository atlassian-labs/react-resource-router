export const isNodeEnvironment = () => {
  if (typeof window === 'undefined') {
    return true;
  }

  if (window.name === 'nodejs') {
    return true;
  }

  return false;
};
