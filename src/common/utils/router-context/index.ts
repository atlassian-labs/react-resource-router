import { qs } from 'url-parse';

import { DEFAULT_MATCH, DEFAULT_ROUTE } from '../../constants';
import {
  Location,
  MatchParams,
  Query,
  Route,
  Routes,
  RouterContext,
} from '../../types';
import matchRoute from '../match-route';
import generatePath from '../generate-path';

export const createRouterContext = (
  route: Route,
  params: MatchParams = {},
  query: Query = {},
  basePath = ''
): RouterContext => {
  const pathname = generatePath(route.path, params);
  const matchedRoute = matchRoute([route], pathname, query, basePath);

  return {
    route,
    match: matchedRoute ? matchedRoute.match : DEFAULT_MATCH,
    query,
  };
};

export const findRouterContext = (
  routes: Routes,
  location: Location,
  basePath = ''
): RouterContext => {
  const { pathname, search } = location;
  const query = qs.parse(search) as Query;
  const matchedRoute = matchRoute(routes, pathname, query, basePath);

  return {
    query,
    route: matchedRoute ? matchedRoute.route : DEFAULT_ROUTE,
    match: matchedRoute ? matchedRoute.match : DEFAULT_MATCH,
  };
};
