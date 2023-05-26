import { RouteWithResources } from '../../../../common/types';

export const routeHasResources = (route: RouteWithResources | null): boolean =>
  !!(route && route.resources && route.resources.length > 0);

export const routeHasChanged = (
  prev: RouteWithResources,
  next: RouteWithResources
): boolean => prev.name !== next.name || prev.path !== next.path;
