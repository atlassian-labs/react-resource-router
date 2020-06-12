import React from 'react';

import { createMemoryHistory, MemoryHistoryBuildOptions } from 'history';

import { Router } from '../router';
import { RouterProps } from '../router/types';

import { MemoryRouterProps } from '../../common/types';

const getRouterProps = (memoryRouterProps: MemoryRouterProps) => {
  const {
    isStatic = false,
    routes,
    resourceData,
    resourceContext,
  } = memoryRouterProps;
  let routerProps: Partial<RouterProps> = {
    routes,
    isStatic,
  };

  if (resourceData) {
    routerProps = { ...routerProps, resourceData };
  }

  if (resourceContext) {
    routerProps = { ...routerProps, resourceContext };
  }

  return routerProps;
};

/**
 * Ensures the router store uses memory history.
 *
 */
export const MemoryRouter = (props: MemoryRouterProps) => {
  const { location, children } = props;
  const config: MemoryHistoryBuildOptions = {};

  if (location) {
    config.initialEntries = [location];
  }

  const history = createMemoryHistory(config);
  const routerProps = getRouterProps(props);

  return (
    // @ts-ignore suppress history will be overwritten warning
    <Router history={history} {...(routerProps as RouterProps)}>
      {children}
    </Router>
  );
};
