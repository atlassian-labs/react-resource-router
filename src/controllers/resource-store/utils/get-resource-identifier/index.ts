import {
  ResourceStoreContext,
  RouteResource,
  RouterStoreContext,
} from '../../../../common/types';

export const getResourceIdentifier = (
  resource: RouteResource,
  routerStoreContext: RouterStoreContext,
  resourceStoreContext: ResourceStoreContext,
): string => {
  const { type, getKey } = resource;
  const key = getKey(routerStoreContext, resourceStoreContext);

  return `${type}/${key}`;
};

export const getResourceIdentifiers = (
  resources: RouteResource[],
  routerStoreContext: RouterStoreContext,
  resourceStoreContext: ResourceStoreContext,
): string[] =>
  resources.map(resource =>
    getResourceIdentifier(resource, routerStoreContext, resourceStoreContext),
  );
