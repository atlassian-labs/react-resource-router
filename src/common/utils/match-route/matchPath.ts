// TAKEN FROM https://github.com/ReactTraining/react-router/blob/master/packages/react-router/modules/matchPath.js

import pathToRegexp from 'path-to-regexp';

const cache: { [key: string]: any } = {};
const cacheLimit = 10000;
let cacheCount = 0;

function compilePath(path: string, options: any) {
  const cacheKey = `${options.end}${options.strict}${options.sensitive}`;
  const pathCache = cache[cacheKey] || (cache[cacheKey] = {});

  if (pathCache[path]) return pathCache[path];

  const keys: any[] = [];
  const regexp = pathToRegexp(path, keys, options);
  const result = { regexp, keys };

  if (cacheCount < cacheLimit) {
    pathCache[path] = result;
    cacheCount++;
  }

  return result;
}

/**
 * Public API for matching a URL pathname to a path.
 * TODO: reduce returns Array<never>
 */
function matchPath(
  pathname: string,
  options: { [key: string]: any } = {},
): any {
  if (typeof options === 'string' || Array.isArray(options)) {
    options = { path: options };
  }

  const { path, exact = false, strict = false, sensitive = false } = options;

  const paths = [].concat(path);

  return paths.reduce((matched: any, path: any) => {
    if (!path && path !== '') return null;
    if (matched) return matched;

    const { regexp, keys } = compilePath(path, {
      end: exact,
      strict,
      sensitive,
    });
    const match = regexp.exec(pathname);

    if (!match) return null;

    const [url, ...values] = match;
    const isExact = pathname === url;

    if (exact && !isExact) return null;

    return {
      path, // the path used to match
      url: path === '/' && url === '' ? '/' : url, // the matched portion of the URL
      isExact, // whether or not we matched exactly
      params: keys.reduce((memo: any, key: any, index: number) => {
        memo[key.name] = values[index];
        return memo;
      }, {}),
    };
  }, null);
}

export default matchPath;
