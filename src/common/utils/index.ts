export { createLegacyHistory } from './create-legacy-history';
export { generateLocationFromPath } from './generate-location';
export { generatePath } from './generate-path';
export { isServerEnvironment } from './is-server-environment';
export {
  default as matchRoute,
  matchInvariantRoute,
  warmupMatchRouteCache,
} from './match-route';
export {
  default as matchRouteOrderIndependent,
  matchRouteByTree as matchRouteOrderIndependentByTree,
} from './match-route-order-independent';
export { treeify } from './match-route-order-independent/tree';
export { findRouterContext, createRouterContext } from './router-context';
export { isSameRouteMatch } from './is-same-route';
