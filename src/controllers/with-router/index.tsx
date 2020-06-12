import React, { ComponentType } from 'react';

import { BrowserHistory, RouteContext } from '../../common/types';
import { RouterActionPush, RouterActionReplace } from '../router-store/types';
import { RouterSubscriber } from '../subscribers/route';

export type WithRouterProps = RouteContext & {
  history: BrowserHistory;
  push: RouterActionPush;
  replace: RouterActionReplace;
};

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

export const withRouter = <P extends Record<string, any> = {}>(
  WrappedComponent: ComponentType<P>
): ComponentType<Omit<P, keyof WithRouterProps>> => {
  const displayName = getWrappedComponentDisplayName(WrappedComponent);
  const Component = WrappedComponent;
  const ComponentWithRouter = (props: any) => (
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
