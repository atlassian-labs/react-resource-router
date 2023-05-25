export { createResourcesPlugin } from './plugin';

export { ResourceSubscriber } from './controllers/resource-subscriber';
export { useResource } from './controllers/use-resource';

export { addResourcesListener } from './controllers/add-resource-listener';

export {
  createResource,
  useResourceStoreContext,
  ResourceDependencyError,
  getResourceStore,
  ResourceStore,
} from './controllers/resource-store';

export type {
  CreateResourceArgBase,
  CreateResourceArgSync,
  CreateResourceArgAsync,
} from './controllers/resource-store';

export type {
  RouteResources,
  ResourceStoreContext,
  ResourceStoreData,
  RouteResource,
  RouteResourceError,
  RouteResourceLoading,
  RouteResourceResponse,
  RouteResourceUpdater,
  RouterDataContext,
  UseResourceHookResponse,
} from './common/types';

export { PLUGIN_ID } from './plugin/index';

export { mockRouteResourceResponse } from './common/mocks';
