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
