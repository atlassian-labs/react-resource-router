import { RouterContext } from '../../../../../index';
import {
  ResourceStoreContext,
  RouteResource,
  RouteWithResources,
} from '../../../../common/types';
import {
  getResourceIdentifier,
  getResourceIdentifiers,
} from '../get-resource-identifier';
import { routeHasChanged, routeHasResources } from '../route-checks';

/**
 * Gets the requestable resources for the next location.
 */
export const getResourcesForNextLocation = (
  prevRouterStoreContext: RouterContext,
  nextRouterStoreContext: RouterContext,
  resourceStoreContext: ResourceStoreContext
): RouteResource[] => {
  const { route: prevRoute } = prevRouterStoreContext;
  const { resources: prevResources = [] } =
    (prevRoute as RouteWithResources) || {};
  const { route: nextRoute } = nextRouterStoreContext;
  const { resources: nextResources = [] } =
    (nextRoute as RouteWithResources) || {};

  if (!routeHasResources(nextRoute)) {
    return [];
  }

  if (routeHasChanged(prevRoute, nextRoute)) {
    return nextResources;
  }

  const prevResourceIdentifiers = getResourceIdentifiers(
    prevResources,
    prevRouterStoreContext,
    resourceStoreContext
  );

  return nextResources.filter(
    resource =>
      !prevResourceIdentifiers.includes(
        getResourceIdentifier(
          resource,
          nextRouterStoreContext,
          resourceStoreContext
        )
      )
  );
};
