import { Plugin, RouterContext } from '../../index';
import type {
  ResourceStoreContext,
  RouteResourceResponse,
  ResourceStoreData,
} from '../common/types';
import { getResourceStore } from '../controllers/resource-store';
import { getResourcesForNextLocation } from '../controllers/resource-store/utils';

export const PLUGIN_ID = 'resources-plugin';

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

type LoadedResources = Promise<RouteResourceResponse<unknown>[]>;

interface ResourcesPlugin extends Plugin {
  getSerializedResources: () => Promise<ResourceStoreData>;
}

export const createResourcesPlugin = ({
  context: initialResourceContext,
  resourceData: initialResourceData,
  timeout,
}: {
  context?: ResourceStoreContext;
  resourceData?: ResourceStoreData;
  timeout?: number;
}): ResourcesPlugin => {
  let latestLoadedResources: LoadedResources = Promise.resolve([]);

  getResourceStore().actions.hydrate({
    resourceContext: initialResourceContext,
    resourceData: initialResourceData,
  });

  return {
    id: PLUGIN_ID,
    beforeRouteLoad: beforeLoad,
    routeLoad: ({ context, prevContext }) => {
      const { route, match, query } = context;
      // TODO: in next refactoring add `if (route.resources)` check
      // For now requesting resources for every route even if `resources` prop is missing on Route
      if (prevContext) {
        latestLoadedResources = loadOnUrlChange(context, prevContext);
      } else {
        latestLoadedResources = getResourceStore().actions.requestAllResources(
          {
            route,
            match,
            query,
          },
          { timeout }
        );
      }
    },
    routePrefetch: ({ context, nextContext }) => {
      const { prefetchResources, getContext: getResourceStoreContext } =
        getResourceStore().actions;

      const nextResources = getResourcesForNextLocation(
        context,
        nextContext,
        getResourceStoreContext()
      );

      return {
        resources: prefetchResources(nextResources, nextContext, {}),
      };
    },
    getLatestResources: (): LoadedResources => latestLoadedResources,
    getSerializedResources: async () => {
      await latestLoadedResources;

      return getResourceStore().actions.getSafeData();
    },
  };
};
