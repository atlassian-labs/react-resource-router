import React, { ReactNode } from 'react';

import { useRouterActions } from '../hooks';
import { RouterActionsType } from '../router-store/types';

type RouterActionsProps = {
  children: (actions: RouterActionsType) => ReactNode;
};

export const RouterActions = ({ children }: RouterActionsProps) => {
  const actions = useRouterActions();

  return <>{children(actions)}</>;
};

RouterActions.displayName = 'RouterActions';
