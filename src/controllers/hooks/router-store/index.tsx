import { useRouterStore, useRouterStoreStatic } from '../../router-store';
import { RouterActionsType, RouterState } from '../../router-store/types';

/**
 * Utility hook for accessing the public router store
 */
export const useRouter = (): [RouterState, RouterActionsType] => {
  const [entireState, allActions] = useRouterStore();

  return [entireState, allActions];
};

/**
 * Hook for accessing the public router store without re-rendering on route change
 */
export const useRouterActions = (): RouterActionsType => {
  const [, allActions] = useRouterStoreStatic();
  return allActions;
};
