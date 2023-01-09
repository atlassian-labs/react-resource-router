import URL from 'url-parse';

class DecodeUriError extends URIError {
  constructor(path: string) {
    super(
      `Pathname ${path} could not be decoded. This is likely caused by an invalid percent-encoding.`
    );
  }
}

export function decodePath(path: string) {
  try {
    return decodeURI(path);
  } catch (e) {
    if (e instanceof URIError) {
      throw new DecodeUriError(path);
    } else {
      throw e;
    }
  }
}

export function parsePath(path: string) {
  const url = new URL(path, 'ws://a.a');
  const isAbsolute = path.startsWith('/');

  const pathname =
    isAbsolute || url.pathname === '/' ? url.pathname : url.pathname.slice(1);

  return {
    pathname,
    search: url.query,
    hash: url.hash,
  };
}
