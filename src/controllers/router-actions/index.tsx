import React, { ReactNode } from 'react';

import { RouterActionsType } from '../router-store/types';
import { useRouterActions } from '../use-router-actions';

type RouterActionsProps = {
  children: (actions: RouterActionsType) => ReactNode;
};

export const RouterActions = ({ children }: RouterActionsProps) => {
  const actions = useRouterActions();

  return <>{children(actions)}</>;
};

RouterActions.displayName = 'RouterActions';
