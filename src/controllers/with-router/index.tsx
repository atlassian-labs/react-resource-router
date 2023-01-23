import React, { ComponentType } from 'react';

import { BrowserHistory, RouteContext } from '../../common/types';
import { useRouterStore } from '../router-store';

type WithRouter = RouteContext & { history: BrowserHistory };

const getWrappedComponentDisplayName = (
  component: ComponentType<any>
): string => {
  let componentDisplayName = 'UNDEFINED';
  const { displayName, name } = component;

  if (displayName) {
    componentDisplayName = displayName;
  }

  if (name) {
    componentDisplayName = name;
  }

  return `withRouter(${componentDisplayName})`;
};

export const withRouter = <P extends Record<string, any>>(
  WrappedComponent: ComponentType<P>
) => {
  const displayName = getWrappedComponentDisplayName(WrappedComponent);
  const Component = WrappedComponent as ComponentType<WithRouter & P>;
  const ComponentWithRouter = (props: P) => {
    const [
      { action, history, location, match, query, route },
      { push, replace },
    ] = useRouterStore();

    return (
      <Component
        {...props}
        action={action}
        history={history}
        location={location}
        match={match}
        push={push}
        query={query}
        replace={replace}
        route={route}
      />
    );
  };

  ComponentWithRouter.displayName = displayName;

  return ComponentWithRouter;
};
