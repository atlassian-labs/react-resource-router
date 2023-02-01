import { createMemoryHistory } from 'history';
import React, { useMemo, useEffect } from 'react';

import { combine } from '../../common/utils/combine';
import { createResourcesLoader } from '../../resources/loader';
import { getResourceStore, ResourceContainer } from '../resource-store';
import {
  getRouterState,
  RouterContainer,
  getRouterStore,
} from '../router-store';

import {
  RouterProps,
  MemoryRouterProps,
  RequestResourcesParams,
  LoadRouteParams,
} from './types';

export const Router = ({
  basePath,
  children,
  history,
  initialRoute,
  isGlobal = true,
  loaders,
  onPrefetch,
  resourceContext,
  resourceData,
  routes,
}: RouterProps) => {
  useEffect(() => {
    const { unlisten } = getRouterState();

    return () => {
      unlisten && unlisten();
    };
  }, []);

  const loader = useMemo(() => {
    if (loaders) return combine(loaders);

    // default 'loaders' fallback for the first relase
    const resourceLoader = createResourcesLoader({
      context: resourceContext,
      resourceData,
    });

    return combine([resourceLoader]);
  }, [resourceContext, resourceData, loaders]);

  return (
    <ResourceContainer isGlobal>
      <RouterContainer
        basePath={basePath}
        history={history}
        initialRoute={initialRoute}
        isGlobal={isGlobal}
        loader={loader}
        onPrefetch={onPrefetch}
        resourceContext={resourceContext}
        resourceData={resourceData}
        routes={routes}
      >
        {children}
      </RouterContainer>
    </ResourceContainer>
  );
};

/**
 * @deprecated
 * The entry point for requesting resource data on the server.
 * Pass the result data into the router as a prop in order to hydrate it.
 */
Router.requestResources = async ({
  location,
  history,
  timeout,
  loaders,
  ...bootstrapProps
}: RequestResourcesParams) => {
  const { bootstrapStore, loadRoute } = getRouterStore().actions;

  const loader = (() => {
    if (loaders) {
      return combine(loaders);
    }

    // default 'loaders' fallback for the first relase
    const resourcesLoader = createResourcesLoader({
      context: bootstrapProps.resourceContext,
      resourceData: null,
      timeout,
    });

    return combine([resourcesLoader]);
  })();

  bootstrapStore({
    ...bootstrapProps,
    history: history || createMemoryHistory({ initialEntries: [location] }),
    loader,
  });

  // await requestRouteResources({ timeout });

  await loadRoute().resources;

  return getResourceStore().actions.getSafeData();
};

Router.loadRoute = ({
  location,
  history,
  loaders,
  routes,
}: LoadRouteParams) => {
  const { bootstrapStore, loadRoute } = getRouterStore().actions;

  bootstrapStore({
    routes,
    history: history || createMemoryHistory({ initialEntries: [location] }),
    loader: combine(loaders),
  });

  return loadRoute();
};

Router.addResourcesListener = (fn: (...args: any) => any) =>
  getResourceStore().storeState.subscribe(fn);

export function MemoryRouter(props: MemoryRouterProps) {
  const history = useMemo(
    () =>
      createMemoryHistory(
        props.location ? { initialEntries: [props.location] } : {}
      ),
    [props.location]
  );

  return <Router {...props} history={history} isGlobal={false} />;
}
