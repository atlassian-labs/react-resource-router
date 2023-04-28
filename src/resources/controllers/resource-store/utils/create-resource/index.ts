import {
  ResourceType,
  RouteResource,
  RouteResourceDataPayload,
} from '../../../../../common/types';

import {
  DEFAULT_CACHE_MAX_LIMIT,
  DEFAULT_RESOURCE_BROWSER_ONLY,
  DEFAULT_RESOURCE_MAX_AGE,
} from './constants';

/**
 * Utility method to created async versions of getData functions
 */
type GetDataLoader<T> = () => Promise<{
  default: RouteResource<T>['getData'];
}>;

export type CreateResourceArgBase = Pick<RouteResource, 'type' | 'getKey'> &
  Partial<Pick<RouteResource, 'maxAge' | 'maxCache' | 'isBrowserOnly'>> & {
    depends?: ResourceType[];
  };

export type CreateResourceArgSync<T> = CreateResourceArgBase & {
  getData: RouteResource<T>['getData'];
};

export type CreateResourceArgAsync<T> = CreateResourceArgBase & {
  getDataLoader: GetDataLoader<T>;
};

const handleGetDataLoader =
  <T>(asyncImport: GetDataLoader<T>) =>
  async (...args: Parameters<RouteResource<T>['getData']>) => {
    const { default: getDataFn } = await asyncImport();

    return getDataFn(...args);
  };

export const createResource = <T extends unknown = RouteResourceDataPayload>(
  arg: CreateResourceArgSync<T> | CreateResourceArgAsync<T>
): RouteResource<T> => ({
  type: arg.type,
  getKey: arg.getKey,
  getData:
    (arg as CreateResourceArgSync<T>).getData ??
    handleGetDataLoader<T>((arg as CreateResourceArgAsync<T>).getDataLoader),
  maxAge:
    typeof arg.maxAge === 'number' ? arg.maxAge : DEFAULT_RESOURCE_MAX_AGE,
  maxCache:
    typeof arg.maxCache === 'number' ? arg.maxCache : DEFAULT_CACHE_MAX_LIMIT,
  isBrowserOnly:
    typeof arg.isBrowserOnly === 'boolean'
      ? arg.isBrowserOnly
      : DEFAULT_RESOURCE_BROWSER_ONLY,
  depends: arg.depends ?? null,
});
