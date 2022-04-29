import React, { ReactNode } from 'react';

import { isServerEnvironment } from '../../../common/utils';
import { RouterSubscriber as BaseRouterSubscriber } from '../../router-store';
import { RouterActionsType, RouterState } from '../../router-store/types';

type Props = {
  children: (state: RouterState, actions: RouterActionsType) => ReactNode;
};

export const RouterSubscriber = ({ children }: Props) => (
  <BaseRouterSubscriber>
    {(state, { listen, ...actions }) => {
      if (!state.unlisten && !isServerEnvironment()) {
        listen();
      }

      return children(state, actions);
    }}
  </BaseRouterSubscriber>
);
