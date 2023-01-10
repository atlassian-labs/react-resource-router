import { useRouterStore } from '../router-store';
import { RouterActionsType, RouterState } from '../router-store/types';

/**
 * Utility hook for accessing the public router store
 *
 * Note that this should eventually filter out private state / actions
 */
export const useRouter: () => [RouterState, RouterActionsType] = useRouterStore;
