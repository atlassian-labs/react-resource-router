import { RouteResource } from '../../../../common/types';
import { ResourceAction } from '../../types';

export const actionWithDependencies = <R extends unknown>(
  _routeResources: RouteResource[] | undefined,
  _resource: RouteResource,
  action: ResourceAction<R>
): ResourceAction<R> => ({ dispatch }) =>
  // stub for future use
  dispatch(action);

export const mapActionWithDependencies = <R extends unknown>(
  _routeResources: RouteResource[] | undefined,
  resources: RouteResource[],
  actionCreator: (resource: RouteResource) => ResourceAction<R>
): ResourceAction<R[]> => ({ dispatch }) =>
  // stub for future use
  resources.map(resource => dispatch(actionCreator(resource)));
