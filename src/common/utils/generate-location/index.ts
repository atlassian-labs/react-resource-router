import pathToRegexp from 'path-to-regexp';
import { qs } from 'url-parse';

import { GenerateLocationOptions, Location } from '../../types';

export function generateLocationFromPath(
  pattern = '/',
  options: GenerateLocationOptions = {}
): Location {
  const { params = {}, query = {}, basePath = '' } = options;
  // @ts-ignore stringify accepts two params but it's type doesn't say so
  const stringifiedQuery = qs.stringify(query, true);
  const pathname =
    pattern === '/' ? pattern : pathToRegexp.compile(pattern)(params);

  return {
    pathname: `${basePath}${pathname}`,
    search: stringifiedQuery,
    hash: '',
  };
}
