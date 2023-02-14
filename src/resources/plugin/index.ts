import type {
  Plugin,
  ResourceStoreContext,
  RouterContext,
  RouteResourceResponse,
} from '../../common/types';
import { getResourceStore } from '../../controllers/resource-store';
import { getResourcesForNextLocation } from '../../controllers/resource-store/utils';

const loadOnUrlChange = (
  context: RouterContext,
  prevContext: RouterContext
) => {
  const { requestResources, getContext: getResourceStoreContext } =
    getResourceStore().actions;

  const nextResources = getResourcesForNextLocation(
    prevContext,
    context,
    getResourceStoreContext()
  );

  return Promise.all(requestResources(nextResources, context, {}));
};

const beforeLoad = ({
  context,
  nextContext,
}: {
  context: RouterContext;
  nextContext: RouterContext;
}) => {
  const { cleanExpiredResources, getContext: getResourceStoreContext } =
    getResourceStore().actions;
  const nextResources = getResourcesForNextLocation(
    context,
    nextContext,
    getResourceStoreContext()
  );
  cleanExpiredResources(nextResources, nextContext);
};

export const createResourcesPlugin = ({
  context: initialResourceContext,
  resourceData: initialResourceData,
  timeout,
}: {
  context?: ResourceStoreContext;
  resourceData: any;
  timeout?: number;
}): Plugin<{
  resources: Promise<RouteResourceResponse<unknown>[]>;
}> => {
  return {
    onHydrate: () => {
      getResourceStore().actions.hydrate({
        resourceContext: initialResourceContext,
        resourceData: initialResourceData,
      });
    },
    onBeforeRouteLoad: beforeLoad,
    onRouteLoad: ({ context, prevContext }) => {
      const { route, match, query } = context;
      // TODO: in next refactoring add `if (route.resources)` check
      // For now requesting resources for every route even if `resources` prop is missing on Route
      if (prevContext) {
        return {
          resources: loadOnUrlChange(context, prevContext),
        };
      }

      return {
        resources: getResourceStore().actions.requestAllResources(
          {
            route,
            match,
            query,
          },
          { timeout }
        ),
      };
    },
    onRoutePrefetch: ({ context, nextContext }) => {
      const { prefetchResources, getContext: getResourceStoreContext } =
        getResourceStore().actions;

      const nextResources = getResourcesForNextLocation(
        context,
        nextContext,
        getResourceStoreContext()
      );

      return {
        resources: prefetchResources(nextResources, context, {}),
      };
    },
  };
};
