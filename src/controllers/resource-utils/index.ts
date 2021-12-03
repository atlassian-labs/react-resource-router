import {
  RouteResource,
  RouteResourceDataPayload,
  RouteResourceGettersArgs,
} from '../../common/types';
import {
  DEFAULT_RESOURCE_MAX_AGE,
  DEFAULT_CACHE_MAX_LIMIT,
  DEFAULT_RESOURCE_IS_BROWSER,
} from '../resource-store/constants';

/**
 * Utility method to created async versions of getData functions
 *
 */
type GetDataLoader<T> = () => Promise<{
  default: RouteResource<T>['getData'];
}>;

type BaseResource = Pick<RouteResource, 'type' | 'getKey'>;

interface CreateResourceSync<T> extends BaseResource {
  getData: RouteResource<T>['getData'];
  maxAge?: number;
  maxCache?: number;
  isBrowser?: boolean;
}
interface CreateResourceAsync<T> extends BaseResource {
  getDataLoader: GetDataLoader<T>;
  maxAge?: number;
  maxCache?: number;
  isBrowser?: boolean;
}

const handleGetDataLoader = (asyncImport: GetDataLoader<unknown>) => {
  return async (...args: RouteResourceGettersArgs) => {
    const { default: getDataFn } = await asyncImport();

    return getDataFn(...args);
  };
};

export function createResource<T extends unknown = RouteResourceDataPayload>(
  args: CreateResourceSync<T>
): RouteResource<T>;
export function createResource<T extends unknown = RouteResourceDataPayload>(
  args: CreateResourceAsync<T>
): RouteResource<T>;
export function createResource(args: any) {
  return {
    type: args.type,
    getKey: args.getKey,
    getData: args.getDataLoader
      ? handleGetDataLoader(args.getDataLoader)
      : args.getData,
    maxAge:
      typeof args.maxAge === 'number' ? args.maxAge : DEFAULT_RESOURCE_MAX_AGE,
    maxCache:
      typeof args.maxCache === 'number'
        ? args.maxCache
        : DEFAULT_CACHE_MAX_LIMIT,
    isBrowser:
      typeof args.isBrowser === 'boolean'
        ? args.isBrowser
        : DEFAULT_RESOURCE_IS_BROWSER,
  };
}
