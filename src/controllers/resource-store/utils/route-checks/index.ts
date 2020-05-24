import { Route } from '../../../../common/types';

export const routeHasResources = (route: Route | null): boolean =>
  !!(route && route.resources && route.resources.length > 0);

export const routeHasChanged = (
  prev: Route | null,
  next: Route | null,
): boolean => prev !== next;
