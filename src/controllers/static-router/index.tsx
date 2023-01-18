import { createMemoryHistory } from 'history';
import React from 'react';

import { MemoryRouterProps } from '../../common/types';
import { combine } from '../../common/utils';
import { createLocation } from '../../common/utils/create-location';
import { entryPointsLoader } from '../../entry-points/loader';
import { resourcesLoader } from '../../resources/loader';
import { MemoryRouter } from '../memory-router';
import { getResourceStore } from '../resource-store';
import type { State } from '../resource-store/types';
import { getRouterStore } from '../router-store';

import { RequestResourcesParams } from './types';

/**
 * Ensures the router store will not respond to history changes.
 *
 */
export const StaticRouter = ({
  location,
  routes,
  children,
  basePath,
}: MemoryRouterProps) => (
  <MemoryRouter
    location={location}
    routes={routes}
    basePath={basePath}
    isStatic
  >
    {children}
  </MemoryRouter>
);

/**
 * The entry point for requesting resource data on the server.
 * Pass the result data into the router as a prop in order to hydrate it.
 * TODO: return type (see imports)
 */
StaticRouter.requestResources = async (props: RequestResourcesParams) => {
  const { bootstrapStore, loadRoute } = getRouterStore().actions;
  const { location, timeout, ...bootstrapProps } = props;
  const initialEntries = [location];
  const overrides = {
    history: createMemoryHistory({ initialEntries }),
    location: createLocation(location),
    isStatic: true,
  };

  const loader = combine(
    entryPointsLoader,
    resourcesLoader
  )({
    context: props.resourceContext,
    isStatic: true,
    resourceData: null,
    timeout,
  });

  bootstrapStore({ ...bootstrapProps, ...overrides, loader });

  await loadRoute().resources;

  // await requestRouteResources({ timeout, isStatic: true }); // TODO: replace with `await loader().loadRoute();`

  return getResourceStore().actions.getSafeData(); // TODO: remove
};

StaticRouter.addResourcesListener = (fn: (nextState: State) => void) => {
  const { storeState } = getResourceStore();

  return storeState.subscribe(() => fn(storeState.getState()));
};
