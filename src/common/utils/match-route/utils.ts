import { Match, Query } from '../../../common/types';

const hasOwnProperty = Object.prototype.hasOwnProperty;
const MAX_CACHE_SIZE = 1000;

function shallowEqual(objA: any, objB: any) {
  if (objA === objB) {
    return true;
  }

  if (
    typeof objA !== 'object' ||
    objA === null ||
    typeof objB !== 'object' ||
    objB === null
  ) {
    return false;
  }

  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) {
    return false;
  }

  // Test for A's keys different from B.
  for (let i = 0; i < keysA.length; i++) {
    if (
      !hasOwnProperty.call(objB, keysA[i]) ||
      objA[keysA[i]] !== objB[keysA[i]]
    ) {
      return false;
    }
  }

  return true;
}

export const matchRouteCache = {
  cache: new Map<string, Map<Query, { route: any; match: Match }>>(),
  get<T>(
    pathname: string,
    queryObj: Query,
    basePath: string
  ): { route: T; match: Match } | void {
    const pathCache = this.cache.get(basePath + pathname);
    if (pathCache) {
      for (const [key, value] of pathCache) {
        if (shallowEqual(key, queryObj)) return value;
      }
    }
  },
  set<T>(
    pathname: string,
    queryObj: Query,
    basePath: string,
    matchRoute: { route: T; match: Match }
  ): void {
    if (this.cache.size > MAX_CACHE_SIZE) this.cache.clear();
    const pathCache = this.cache.get(basePath + pathname);
    if (pathCache) {
      if (pathCache.size > MAX_CACHE_SIZE / 10) pathCache.clear();
      pathCache.set(queryObj, matchRoute);
    } else {
      this.cache.set(basePath + pathname, new Map([[queryObj, matchRoute]]));
    }
  },
};
