import { decodePath } from './decode-path';
import { parsePath } from './parse-path';

export function createLocation(path = '') {
  const location = parsePath(path);
  location.pathname = decodePath(location.pathname);

  return location;
}
