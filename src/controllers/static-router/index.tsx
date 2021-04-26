import React from 'react';

import { createLocation, createMemoryHistory } from 'history';

import { MemoryRouterProps } from '../../common/types';
import { MemoryRouter } from '../memory-router';
import { getResourceStore } from '../resource-store';
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
  const { bootstrapStore, requestRouteResources } = getRouterStore().actions;
  const { location, maxWaitTime, ...bootstrapProps } = props;
  const initialEntries = [location];
  const overrides = {
    history: createMemoryHistory({ initialEntries }),
    location: createLocation(location),
    isStatic: true,
  };

  bootstrapStore({ ...bootstrapProps, ...overrides });

  await requestRouteResources({ maxWaitTime });

  return getResourceStore().actions.getSafeData();
};

StaticRouter.addResourcesListener = (fn: (...args: any) => any) =>
  getResourceStore().storeState.subscribe(fn);
