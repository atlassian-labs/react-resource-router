import React, { useMemo, useEffect } from 'react';
import { createMemoryHistory } from 'history';

import { createLocation } from '../../common/utils/create-location';
import { getRouterState, RouterContainer } from '../router-store';
import { getResourceStore, ResourceContainer } from '../resource-store';
import { getRouterStore } from '../router-store';

import {
  RouterProps,
  MemoryRouterProps,
  RequestResourcesParams,
} from './types';

const Router = ({
  basePath,
  children,
  initialRoute,
  isGlobal = true,
  onPrefetch,
  resourceContext,
  resourceData,
  routes,
  ...props
}: RouterProps) => {
  const history = useMemo(
    () =>
      props.history ||
      createMemoryHistory(
        props.location ? { initialEntries: [props.location] } : {}
      ),
    [props.history, props.location]
  );

  useEffect(() => {
    const { unlisten } = getRouterState();

    return () => {
      unlisten && unlisten();
    };
  }, []);

  return (
    <ResourceContainer isGlobal={isGlobal}>
      <RouterContainer
        basePath={basePath}
        history={history}
        initialRoute={initialRoute}
        isGlobal={isGlobal}
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
  timeout,
  history,
  ...bootstrapProps
}: RequestResourcesParams) => {
  const { bootstrapStore, requestRouteResources } = getRouterStore().actions;

  bootstrapStore({
    ...bootstrapProps,
    history: history || createMemoryHistory({ initialEntries: [location] }),
    location: createLocation(location),
  });

  await requestRouteResources({ timeout });

  return getResourceStore().actions.getSafeData();
};

Router.addResourcesListener = (fn: (...args: any) => any) =>
  getResourceStore().storeState.subscribe(fn);

// Expose
const MemoryRouter = (props: MemoryRouterProps) => (
  <Router {...props} isGlobal={false} />
);

export { Router, MemoryRouter };
