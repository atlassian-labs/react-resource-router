import { useRouterStore } from '../router-store';
import { RouterActionsType, RouterState } from '../router-store/types';

/**
 * Utility hook for accessing the public router store
 */
export const useRouter = (): [RouterState, RouterActionsType] => {
  const [state, actions] = useRouterStore();

  return [state, actions];
};
