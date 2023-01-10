import { useRouterStoreActions } from '../router-store';
import { RouterActionsType } from '../router-store/types';

/**
 * Hook for accessing the public router store without re-rendering on route change
 */
export const useRouterActions = (): RouterActionsType => {
  const [, actions] = useRouterStoreActions();

  return actions;
};
