export const isServerEnvironment = () => {
  return globalThis !== globalThis.window;
};
