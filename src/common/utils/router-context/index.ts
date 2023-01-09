import { qs } from 'url-parse';

import { DEFAULT_MATCH, DEFAULT_ROUTE } from '../../constants';
import {
  Query,
  Route,
  Routes,
  RouterContext,
  CreateRouterContextOptions,
  FindRouterContextOptions,
} from '../../types';
import { generatePath } from '../generate-path';
import matchRoute from '../match-route';

export const createRouterContext = (
  route: Route,
  options: CreateRouterContextOptions = {}
): RouterContext => {
  const { params = {}, query = {}, basePath = '' } = options;
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
  options: FindRouterContextOptions
): RouterContext => {
  const { location, basePath = '' } = options;
  const { pathname, search } = location;
  const query = qs.parse(search) as Query;
  const matchedRoute = matchRoute(routes, pathname, query, basePath);

  return {
    query,
    route: matchedRoute ? matchedRoute.route : DEFAULT_ROUTE,
    match: matchedRoute ? matchedRoute.match : DEFAULT_MATCH,
  };
};
