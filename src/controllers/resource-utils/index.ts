import { RouteResource, RouteResourceGettersArgs } from '../../common/types';
import { DEFAULT_RESOURCE_MAX_AGE } from '../resource-store/constants';

/**
 * Utility method to created async versions of getData functions
 *
 */
type GetDataLoader = () => Promise<{
  default: RouteResource['getData'];
}>;

type BaseResource = Pick<RouteResource, 'type' | 'getKey'>;

interface CreateResourceSync extends BaseResource {
  getData: RouteResource['getData'];
  maxAge?: number;
}
interface CreateResourceAsync extends BaseResource {
  getDataLoader: (
    ...args: RouteResourceGettersArgs
  ) => Promise<{
    default: GetDataLoader;
  }>;
  maxAge?: number;
}

const handleGetDataLoader = (asyncImport: GetDataLoader) => {
  return async (...args: RouteResourceGettersArgs) => {
    const { default: getDataFn } = await asyncImport();
    return getDataFn(...args);
  };
};

export function createResource(args: CreateResourceSync): RouteResource;
export function createResource(args: CreateResourceAsync): RouteResource;
export function createResource(args: any) {
  return {
    type: args.type,
    getKey: args.getKey,
    getData: args.getDataLoader
      ? handleGetDataLoader(args.getDataLoader)
      : args.getData,
    maxAge:
      typeof args.maxAge === 'number' ? args.maxAge : DEFAULT_RESOURCE_MAX_AGE,
  };
}
