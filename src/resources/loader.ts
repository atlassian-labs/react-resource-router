import type {
  LoaderAPI,
  ResourceStoreContext,
  RouterContext,
  RouteResourceResponse,
} from '../common/types';
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

  return Promise.all(requestResources(nextResources, nextLocationContext, {}));
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

export const resourcesLoader = ({
  context: resourceContext,
  isStatic,
  resourceData,
  timeout,
}: {
  context: ResourceStoreContext | undefined;
  resourceData: any;
  timeout?: number;
  isStatic?: boolean;
}): LoaderAPI<{
  resources: Promise<RouteResourceResponse<unknown>[]>;
}> => {
  return {
    hydrate: () => {
      getResourceStore().actions.hydrate({ resourceContext, resourceData });
    },
    onBeforeRouteChange,
    load: ({ route, match, query, prevLocationContext }) => {
      // TODO: in next refactoring add `if (route.resources)` check
      // For now requesting resources for every route even if `resources` prop is missing on Route
      if (prevLocationContext) {
        return {
          resources: loadOnUrlChange({
            route,
            match,
            query,
            prevLocationContext,
          }),
        };
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
