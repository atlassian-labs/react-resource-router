import { qs } from 'url-parse';

import {
  InvariantRoutes,
  MatchedRoute,
  MatchedInvariantRoute,
  Query,
  Routes,
  Route,
  InvariantRoute,
} from '../../types';
import execRouteMatching from './exec-route-matching';
import { matchRouteCache } from './utils';

/**
 * Does the given `pathname` and `queryStr` match a route in `routes`.
 *
 * Heavily based on https://github.com/ReactTraining/react-router/blob/master/packages/react-router-config/modules/matchRoute.js
 *
 * Note: This does not support nested routes at this stage.
 */
const matchRoute = <T extends Route | InvariantRoute>(
  routes: T[],
  pathname: string,
  queryParams: Query = {},
  basePath = ''
) => {
  const queryParamObject =
    typeof queryParams === 'string'
      ? (qs.parse(queryParams) as Query)
      : queryParams;

  const cachedMatch = matchRouteCache.get<T>(
    pathname,
    queryParamObject,
    basePath
  );
  if (cachedMatch && routes.includes(cachedMatch.route)) return cachedMatch;

  for (let i = 0; i < routes.length; i++) {
    const matchedRoute = execRouteMatching(
      routes[i],
      pathname,
      queryParamObject,
      basePath
    );
    if (matchedRoute) {
      matchRouteCache.set(pathname, queryParamObject, basePath, matchedRoute);

      return matchedRoute;
    }
  }

  return null;
};

export const matchInvariantRoute = (
  routes: InvariantRoutes,
  pathname: string,
  queryParams: Query,
  basePath = ''
): MatchedInvariantRoute | null =>
  matchRoute(routes, pathname, queryParams, basePath);

export default (
  routes: Routes,
  pathname: string,
  queryParams: Query,
  basePath = ''
): MatchedRoute | null => matchRoute(routes, pathname, queryParams, basePath);
