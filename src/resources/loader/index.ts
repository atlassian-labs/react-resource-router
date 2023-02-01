import type {
  Loader,
  ResourceStoreContext,
  RouterContext,
  RouteResourceResponse,
} from '../../common/types';
import { getResourceStore } from '../../controllers/resource-store';
import { getResourcesForNextLocation } from '../../controllers/resource-store/utils';
import { getRouterState } from '../../controllers/router-store';

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

export const createResourcesLoader = ({
  context: initialResourceContext,
  resourceData: initialResourceData,
  timeout,
}: {
  context?: ResourceStoreContext;
  resourceData: any;
  timeout?: number;
}): Loader<{
  resources: Promise<RouteResourceResponse<unknown>[]>;
}> => {
  return {
    hydrate: () => {
      getResourceStore().actions.hydrate({
        resourceContext: initialResourceContext,
        resourceData: initialResourceData,
      });
    },
    beforeLoad,
    load: ({ context, prevContext }) => {
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
    prefetch: (context: RouterContext) => {
      const { route, match, query } = getRouterState();
      const { prefetchResources, getContext: getResourceStoreContext } =
        getResourceStore().actions;

      const nextResources = getResourcesForNextLocation(
        { route, match, query },
        context,
        getResourceStoreContext()
      );

      return {
        resources: prefetchResources(nextResources, context, {}),
      };
    },
  };
};
