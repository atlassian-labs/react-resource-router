import React, { useRef } from 'react';

import { createMemoryHistory } from 'history';

import { Router } from '../router';

import { MemoryRouterProps } from '../../common/types';

const lazy = <T extends any>(callback: () => T) => {
  let firstCall = true;
  let current: T | undefined = undefined;

  return () => {
    if (firstCall) {
      current = callback();
      firstCall = false;
    }

    return current;
  };
};

const useMemoryHistory = (location: string | undefined) => {
  const newGetHistory = lazy(() =>
    createMemoryHistory({
      initialEntries: location !== undefined ? [location] : undefined,
    })
  );

  const historyStateCandidate = {
    getHistory: newGetHistory,
    location,
  };

  const historyState = useRef(historyStateCandidate);

  if (historyState.current.location !== historyStateCandidate.location) {
    historyState.current = historyStateCandidate;
  }

  return historyState.current.getHistory();
};

/**
 * Ensures the router store uses memory history.
 *
 */
export const MemoryRouter = ({
  isStatic = false,
  isGlobal = true,
  location,
  children,
  basePath,
  routes,
  resourceData,
  resourceContext,
}: MemoryRouterProps) => {
  const history = useMemoryHistory(location);

  return (
    // @ts-ignore suppress history will be overwritten warning
    <Router
      isStatic={isStatic}
      isGlobal={isGlobal}
      history={history}
      basePath={basePath}
      routes={routes}
      resourceData={resourceData}
      resourceContext={resourceContext}
    >
      {children}
    </Router>
  );
};
