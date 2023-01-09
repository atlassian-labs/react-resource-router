import { decodePath, parsePath } from './utils';

export function createLocation(path = '') {
  const location = parsePath(path);
  location.pathname = decodePath(location.pathname);

  return location;
}
