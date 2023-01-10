import { useRouterStoreActions } from '../router-store';
import { RouterActionsType } from '../router-store/types';

/**
 * Hook for accessing the public router store without re-rendering on route change
 *
 * Note that this should eventually filter out private state / actions
 */
export const useRouterActions: () => RouterActionsType = useRouterStoreActions;
