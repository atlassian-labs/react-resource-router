import React, { ComponentType } from 'react';

import { BrowserHistory, RouteContext } from '../../common/types';
import { RouterSubscriber } from '../subscribers/route';

// TODO
export type WithRouter = RouteContext & { history: BrowserHistory };

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
  const ComponentWithRouter = (props: WithRouter & P) => (
    <RouterSubscriber>
      {(
        // @ts-ignore access private `history` store property
        { route, location, query, match, action, history },
        { push, replace }
      ) => (
        <Component
          {...props}
          route={route}
          location={location}
          query={query}
          match={match}
          action={action}
          history={history}
          push={push}
          replace={replace}
        />
      )}
    </RouterSubscriber>
  );
  ComponentWithRouter.displayName = displayName;

  return ComponentWithRouter;
};
