import React, { ReactNode } from 'react';

import { useRouterStore } from '../router-store';
import { RouterActionsType, RouterState } from '../router-store/types';

export type RouterSubscriberProps = {
  children: (state: RouterState, actions: RouterActionsType) => ReactNode;
};

export const RouterSubscriber = ({ children }: RouterSubscriberProps) => {
  const [state, { listen, ...actions }] = useRouterStore();

  if (!state.unlisten && !state.isStatic) {
    listen();
  }

  return <>{children(state, actions)}</>;
};
