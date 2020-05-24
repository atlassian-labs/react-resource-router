// NOTE! This has been copy pasted from https://github.com/sindresorhus/serialize-error/blob/master/index.js
// When the router moves to its own package, this must become a dependency
// For now, we have put it here so that we don't need to get it included in Jira's vendor bundle

class NonError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NonError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, NonError);
    }
  }
}

const commonProperties = ['name', 'message', 'stack', 'code'];

const destroyCircular = (from: any, seen: any, to_?: any) => {
  const to = to_ || (Array.isArray(from) ? [] : {});

  seen.push(from);

  for (const [key, value] of Object.entries(from)) {
    if (typeof value === 'function') {
      continue;
    }

    if (!value || typeof value !== 'object') {
      to[key] = value;
      continue;
    }

    if (!seen.includes(from[key])) {
      to[key] = destroyCircular(from[key], seen.slice());
      continue;
    }

    to[key] = '[Circular]';
  }

  for (const property of commonProperties) {
    if (typeof from[property] === 'string') {
      to[property] = from[property];
    }
  }

  return to;
};

// const serializeError = <ErrorType = any>(value: ErrorType) => {
export const serializeError = (value: any) => {
  if (typeof value === 'object' && value !== null) {
    return destroyCircular(value, []);
  }

  // People sometimes throw things besides Error objects…
  if (typeof value === 'function') {
    // `JSON.stringify()` discards functions. We do too, unless a function is thrown directly.
    return `[Function: ${value.name || 'anonymous'}]`;
  }

  return value;
};

export const deserializeError = (value: any) => {
  if (value instanceof Error) {
    return value;
  }

  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    const newError = new Error();
    destroyCircular(value, [], newError);
    return newError;
  }

  return new NonError(value);
};
