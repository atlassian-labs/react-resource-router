import { Route } from '../../../../../common/types';

export const routeHasResources = (route: Route | null): boolean =>
  !!(route && route.resources && route.resources.length > 0);

export const routeHasChanged = (prev: Route, next: Route): boolean =>
  prev.name !== next.name || prev.path !== next.path;
