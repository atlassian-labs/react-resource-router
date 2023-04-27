import type { RouterContext } from '../../../../../index';
import type {
  ResourceStoreContext,
  RouteResource,
} from '../../../../common/types';

export const getResourceIdentifier = (
  resource: RouteResource,
  routerStoreContext: RouterContext,
  resourceStoreContext: ResourceStoreContext
): string => {
  const { type, getKey } = resource;
  const key = getKey(routerStoreContext, resourceStoreContext);

  return `${type}/${key}`;
};

export const getResourceIdentifiers = (
  resources: RouteResource[],
  routerStoreContext: RouterContext,
  resourceStoreContext: ResourceStoreContext
): string[] =>
  resources.map(resource =>
    getResourceIdentifier(resource, routerStoreContext, resourceStoreContext)
  );
