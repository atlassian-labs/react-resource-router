import { DEFAULT_CACHE_MAX_LIMIT } from '../../constants';
import { RouteResourceDataForType } from '../../../../common/types';

export const getValidResourceDataKeys = (
  routeResourceDataForType: RouteResourceDataForType,
  currentKey: string
): string[] =>
  Object.keys(routeResourceDataForType).filter(resourceDataKey => {
    const {
      [resourceDataKey]: { expiresAt, loading },
    } = routeResourceDataForType;

    return (
      resourceDataKey !== currentKey &&
      ((expiresAt && expiresAt > Date.now()) || loading)
    );
  });

export const getLRUResourceKey = (
  maxCache: number,
  resourceDataForType: RouteResourceDataForType,
  currentKey: string
): null | string => {
  if (maxCache === DEFAULT_CACHE_MAX_LIMIT || maxCache < 1) {
    return null;
  }

  const validResourceDataKeys = getValidResourceDataKeys(
    resourceDataForType,
    currentKey
  );
  if (validResourceDataKeys.length < maxCache) {
    return null;
  }

  return validResourceDataKeys.reduce((leastRecentKey: string, key: string) => {
    const {
      [key]: { accessedAt },
      [leastRecentKey]: { accessedAt: leastRecentAccessedAt },
    } = resourceDataForType;

    if (
      accessedAt &&
      leastRecentAccessedAt &&
      accessedAt < leastRecentAccessedAt
    ) {
      return key;
    }

    return leastRecentKey;
  }, validResourceDataKeys[0]);
};
