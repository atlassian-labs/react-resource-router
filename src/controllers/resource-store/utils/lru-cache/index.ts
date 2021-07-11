import { StoreActionApi } from 'react-sweet-state';
import { deleteResourceKey } from '../manage-resource-state';
import { State } from '../../types';

import {
  RouteResource,
  RouteResourceDataForType,
} from '../../../../common/types';

export const getExpiredResourceDataKeys = (
  routeResourceDataForType: RouteResourceDataForType,
  currentKey: string
): string[] =>
  Object.keys(routeResourceDataForType).filter(resourceDataKey => {
    const {
      [resourceDataKey]: { expiresAt },
    } = routeResourceDataForType;

    return (
      resourceDataKey !== currentKey && expiresAt && expiresAt <= Date.now()
    );
  });

export const getLRUResourceKey = (
  maxCache: number,
  resourceDataForType: RouteResourceDataForType,
  currentKey: string
): null | string => {
  if (maxCache === Infinity || maxCache < 1) {
    return null;
  }

  const resourceDataKeys = Object.keys(resourceDataForType);

  if (resourceDataKeys.length < maxCache) {
    return null;
  }

  const expiredResourceDataKeys = getExpiredResourceDataKeys(
    resourceDataForType,
    currentKey
  );

  if (expiredResourceDataKeys.length > 0) {
    return expiredResourceDataKeys[0];
  }

  return resourceDataKeys.reduce((leastRecentKey: string, key: string) => {
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
  }, resourceDataKeys[0]);
};

export const validateLRUCache = (resource: RouteResource, key: string) => ({
  getState,
  dispatch,
}: StoreActionApi<State>) => {
  const { type, maxCache } = resource;
  const {
    data: { [type]: resourceDataForType },
  } = getState();

  if (!resourceDataForType) {
    return;
  }

  const keyTobeDeleted = getLRUResourceKey(maxCache, resourceDataForType, key);
  if (!keyTobeDeleted) {
    return;
  }
  dispatch(deleteResourceKey(keyTobeDeleted, type));
};
