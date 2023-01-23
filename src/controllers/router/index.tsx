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
    const resources = createResourcesLoader({
      context: resourceContext,
      resourceData,
    });

    return combine([resources]);
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
    const resources = createResourcesLoader({
      context: bootstrapProps.resourceContext,
      resourceData: null,
      timeout,
    });

    return combine([resources]);
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
