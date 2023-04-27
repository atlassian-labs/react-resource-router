export {
  mockLocation,
  mockMatch,
  mockMatchedRoute,
  mockQuery,
  mockRoute,
  mockRouteContext,
  mockRouteContextProp,
  mockRouterActions,
  mockRouterStoreContext,
  mockRouterStoreContextProp,
  mockRoutes,
} from './common/mocks';

import { ResourceDependencyError } from './index';

ResourceDependencyError;

/**
 * @deprecated import from react-resource-router/resources instead
 */
export { mockRouteResourceResponse } from './resources';
