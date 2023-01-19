import type { Loader, RouterContext } from '../common/types';
import { getResourceStore } from '../controllers/resource-store';
import { getResourcesForNextLocation } from '../controllers/resource-store/utils';
import { getRouterState } from '../controllers/router-store';

const loadOnUrlChange = ({
  route,
  match,
  query,
  prevLocationContext,
}: RouterContext & {
  prevLocationContext: RouterContext;
}) => {
  const {
    route: prevRoute,
    match: prevMatch,
    query: prevQuery,
  } = prevLocationContext;
  const { requestResources, getContext: getResourceStoreContext } =
    getResourceStore().actions;

  const nextLocationContext = {
    route,
    match,
    query,
  };
  const nextResources = getResourcesForNextLocation(
    {
      route: prevRoute,
      match: prevMatch,
      query: prevQuery,
    },
    nextLocationContext,
    getResourceStoreContext()
  );

  requestResources(nextResources, nextLocationContext, {});
};

const onBeforeRouteChange = ({
  prevLocationContext,
  nextLocationContext,
}: {
  prevLocationContext: RouterContext;
  nextLocationContext: RouterContext;
}) => {
  const { cleanExpiredResources, getContext: getResourceStoreContext } =
    getResourceStore().actions;

  const nextResources = getResourcesForNextLocation(
    prevLocationContext,
    nextLocationContext,
    getResourceStoreContext()
  );

  cleanExpiredResources(nextResources, nextLocationContext);
};

export const resourcesLoader: Loader<any> = ({
  context: resourceContext,
  isStatic,
  resourceData,
  timeout,
}) => {
  getResourceStore().actions.hydrate({ resourceContext, resourceData });

  return {
    onBeforeRouteChange,
    load: ({ route, match, query, prevLocationContext }) => {
      if (route.resources) {
        if (prevLocationContext) {
          loadOnUrlChange({ route, match, query, prevLocationContext });
        }

        return {
          resources: getResourceStore().actions.requestAllResources(
            {
              route,
              match,
              query,
            },
            { isStatic, timeout }
          ),
        };
      }
    },
    prefetch: (nextLocationContext: RouterContext) => {
      const { route, match, query } = getRouterState();
      const { prefetchResources, getContext: getResourceStoreContext } =
        getResourceStore().actions;

      const nextResources = getResourcesForNextLocation(
        { route, match, query },
        nextLocationContext,
        getResourceStoreContext()
      );

      return {
        resources: prefetchResources(nextResources, nextLocationContext, {}),
      };
    },
  };
};
