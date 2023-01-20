import { createMemoryHistory } from 'history';
import React, { useMemo, useEffect } from 'react';

import { createCombinedLoader } from '../loader/index';
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
} from './types';

export const Router = ({
  basePath,
  children,
  history,
  initialRoute,
  isGlobal = true,
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

  const loader = useMemo(
    () =>
      createCombinedLoader({
        context: resourceContext,
        resourceData,
      }),
    [resourceContext, resourceData]
  );

  return (
    <ResourceContainer isGlobal>
      <RouterContainer
        basePath={basePath}
        history={history}
        initialRoute={initialRoute}
        isGlobal={isGlobal}
        onPrefetch={onPrefetch}
        resourceContext={resourceContext}
        resourceData={resourceData}
        routes={routes}
        loader={loader}
      >
        {children}
      </RouterContainer>
    </ResourceContainer>
  );
};

/**
 * The entry point for requesting resource data on the server.
 * Pass the result data into the router as a prop in order to hydrate it.
 */
Router.requestResources = async ({
  location,
  history,
  timeout,
  ...bootstrapProps
}: RequestResourcesParams) => {
  const { bootstrapStore, loadRoute } = getRouterStore().actions;

  const loader = createCombinedLoader({
    context: bootstrapProps.resourceContext,
    resourceData: null,
    timeout,
  });

  bootstrapStore({
    ...bootstrapProps,
    history: history || createMemoryHistory({ initialEntries: [location] }),
    loader,
  });

  // await requestRouteResources({ timeout });

  await loadRoute().resources;

  return getResourceStore().actions.getSafeData();
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
