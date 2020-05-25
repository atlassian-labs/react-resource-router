import { qs } from 'url-parse';

import { DEFAULT_MATCH, DEFAULT_ROUTE } from '../../constants';
import { HistoryAction, Location, Query, Routes } from '../../types';
import matchRoute from '../match-route';

export const getRouteContext = (
  location: Location,
  routes: Routes,
  action: HistoryAction = 'POP'
) => {
  const { pathname, search, hash } = location;
  const query = qs.parse(search) as Query;
  const matchedRoute = matchRoute(routes, pathname, query);

  return {
    location: {
      pathname,
      search,
      hash,
    },
    query,
    route:
      matchedRoute && matchedRoute.route ? matchedRoute.route : DEFAULT_ROUTE,
    match:
      matchedRoute && matchedRoute.match ? matchedRoute.match : DEFAULT_MATCH,
    action,
  };
};
