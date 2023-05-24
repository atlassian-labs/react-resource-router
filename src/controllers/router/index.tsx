import { createMemoryHistory } from 'history';
import React, { useMemo, useEffect } from 'react';

import { getRouterState, RouterContainer } from '../router-store';

import { RouterProps, MemoryRouterProps } from './types';

export const Router = ({
  basePath,
  children,
  history,
  initialRoute,
  isGlobal = true,
  plugins,
  onPrefetch,
  routes,
}: RouterProps) => {
  useEffect(() => {
    const { unlisten } = getRouterState();

    return () => {
      unlisten && unlisten();
    };
  }, []);

  return (
    <RouterContainer
      basePath={basePath}
      history={history}
      initialRoute={initialRoute}
      isGlobal={isGlobal}
      onPrefetch={onPrefetch}
      plugins={plugins}
      routes={routes}
    >
      {children}
    </RouterContainer>
  );
};

export function MemoryRouter(props: MemoryRouterProps) {
  const history = useMemo(
    () =>
      createMemoryHistory(
        props.location ? { initialEntries: [props.location] } : {}
      ),
    [props.location]
  );

  return (
    <Router
      {...props}
      history={history}
      isGlobal={false}
      plugins={props.plugins || []}
    />
  );
}
