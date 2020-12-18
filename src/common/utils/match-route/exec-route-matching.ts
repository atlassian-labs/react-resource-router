import { Query, Route, InvariantRoute, Match } from '../../types';

import matchPath from './matchPath';
import matchQuery from './matchQuery';

/* This should match what react-router does to compute a root match. */
const computeRootMatch = (pathname: string) => ({
  path: '/',
  url: '/',
  params: {},
  isExact: pathname === '/',
  query: {},
});

function execRouteMatching<T extends Route | InvariantRoute>(
  route: T,
  pathname: string,
  queryObj: Query,
  basePath: string
): { route: T; match: Match } | null {
  const pathMatch = route.path
    ? matchPath(pathname, {
        path: route.path,
        exact: route.exact,
        basePath,
      })
    : computeRootMatch(pathname);
  let match = pathMatch;

  if (pathMatch && route.query) {
    match = matchQuery(route.query, queryObj, pathMatch);
  } else if (pathMatch) {
    match = { ...pathMatch, query: {} };
  }

  if (match) {
    return { match, route };
  }

  return null;
}

export default execRouteMatching;
