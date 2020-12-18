/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { ReactNode } from 'react';

import { BoundActions } from 'react-sweet-state';

import { RouterActionsSubscriber } from '../router-store';
import { EntireRouterState, RouterActionsType } from '../router-store/types';

type Props = {
  children: (actions: RouterActionsType) => ReactNode;
};

export const RouterActions = ({ children }: Props) => (
  <RouterActionsSubscriber>
    {(__, { bootstrapStore, listen, requestRouteResources, ...actions }) =>
      children(actions)
    }
  </RouterActionsSubscriber>
);

RouterActions.displayName = 'RouterActions';
