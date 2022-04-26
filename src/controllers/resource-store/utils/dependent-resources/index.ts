import {
  RouteResource,
  ResourceDependencies,
  RouterContext,
  ResourceType,
} from '../../../../common/types';
import {
  ExecutionTuple,
  ExecutionMaybeTuple,
  ResourceAction,
} from '../../types';
import { getSliceForResource } from '../../selectors';

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/fromEntries
const fromEntries =
  Object.fromEntries ??
  (<T>(entries: [string, T][]) =>
    Object.assign({}, ...entries.map(([k, v]) => ({ [k]: v }))));

type MatchableType =
  | { type: ResourceType }
  | RouteResource
  | ExecutionTuple
  | ExecutionMaybeTuple;
const matchType = (a: MatchableType) => (b: MatchableType) => {
  const [{ type: typeA }] = Array.isArray(a) ? a : [a];
  const [{ type: typeB }] = Array.isArray(b) ? b : [b];

  return typeA === typeB;
};

export class ResourceDependencyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ResourceDependencyError';
  }
}

export const executeTuples = <R>(
  routeResources: RouteResource[] | null | undefined,
  tuples: ExecutionTuple[]
): ResourceAction<R[]> => ({ getState, setState, dispatch }) => {
  if (getState().executing) {
    throw new Error('execution is already in progress');
  }

  // we cannot execute dependencies without route resources, regardless of whether tuple resource specifies dependency
  const hasExecutableDependency =
    routeResources?.some(({ depends }) => depends?.length) ?? false;

  // optimise for no dependencies
  if (!hasExecutableDependency) {
    return tuples.map(([, action]) => dispatch(action));
  }

  // find all the resources on the route that have dependencies or are depended upon
  // this potentially larger than needed since it is not specific to the resource being
  // executed but its cheaper than analysing dependencies properly
  // removing duplicates is not essential but helps debugging
  const interdependentRouteResourceTypes = routeResources!
    .reduceRight(
      (acc, { type, depends }) => (depends ? [...acc, type, ...depends] : acc),
      [] as ResourceType[]
    )
    .filter((v, i, a) => a.indexOf(v) === i);

  // simply dispatch actions for independent resources
  const independentTuples = tuples.filter(
    ([{ type }]) => !interdependentRouteResourceTypes?.includes(type)
  );
  const independentResults = independentTuples.map(([, action]) =>
    dispatch(action)
  );

  // complete without entering executing state where possible
  if (independentTuples.length === tuples.length) {
    return independentResults;
  }

  // setup executing tuples in route resource order just for the interdependent resources
  // this state allows actions to call executeForDependents() to influence actions that follow
  // we don't include independent resources to help debugging routes with many resources but sparse dependencies
  // the list includes non-executing resources so that getDependencies() may validate without needing route resources
  // we use the resource definition of the given tuple where present otherwise use the definition from route resource
  const executingTuples: ExecutionMaybeTuple[] = routeResources!
    .filter(({ type }) => interdependentRouteResourceTypes.includes(type))
    .map(resource => tuples.find(matchType(resource)) ?? [resource, null]);

  setState({ executing: executingTuples });

  // dispatch sequentially during which executeForDependents() can cause tuples to change
  const executedResults = executingTuples.map(([{ type: expectedType }], i) => {
    const latestTuple = getState().executing?.[i];
    const [{ type: latestType }, maybeAction] = latestTuple ?? [{}];

    if (latestType !== expectedType) {
      setState({ executing: null });
      throw new Error('execution reached an inconsistent state');
    }

    return maybeAction ? dispatch(maybeAction) : undefined;
  });

  setState({ executing: null });

  // combine results
  const allTuples = [...independentTuples, ...executingTuples];
  const allResults = [...independentResults, ...executedResults];

  return tuples.map(
    ([resource]) => allResults[allTuples.findIndex(matchType(resource))]
  );
};

export const actionWithDependencies = <R extends unknown>(
  routeResources: RouteResource[] | undefined,
  resource: RouteResource,
  action: ResourceAction<R>
): ResourceAction<R> => ({ dispatch }) =>
  dispatch(
    executeTuples<R>(routeResources, [[resource, action]])
  )[0];

export const mapActionWithDependencies = <R extends unknown>(
  routeResources: RouteResource[] | undefined,
  resources: RouteResource[],
  actionCreator: (resource: RouteResource) => ResourceAction<R>
): ResourceAction<R[]> =>
  executeTuples<R>(
    routeResources,
    resources.map(resource => [resource, actionCreator(resource)])
  );

export const executeForDependents = <R extends unknown>(
  resource: RouteResource,
  actionCreator: (resource: RouteResource) => ResourceAction<R>
): ResourceAction<void> => ({ getState, setState }) => {
  const { executing: tuples } = getState();

  // find the given resource in the currently executing tuples
  const indexForResource = tuples?.findIndex(matchType(resource)) ?? -1;
  if (indexForResource < 0) {
    return;
  }

  // find dependent resources following given resource and revise their action
  const executing = tuples!.map(
    (tuple, i): ExecutionMaybeTuple => {
      const [tupleResource] = tuple;

      return i > indexForResource &&
        tupleResource.depends?.includes(resource.type)
        ? [tupleResource, actionCreator(tupleResource)]
        : tuple;
    }
  );

  setState({ executing });
};

export const getDependencies = (
  resource: RouteResource,
  routerStoreContext: RouterContext
): ResourceAction<ResourceDependencies> => ({ getState }) => {
  const { type, depends } = resource;

  // optimise the case of no dependencies
  if (!depends?.length) {
    return {};
  }

  const { executing: tuples, data, context: resourceStoreContext } = getState();

  // dependent resource cannot be called outside execution state
  // find the given resource type in the currently executing tuples
  const indexForResource = tuples?.findIndex(matchType(resource)) ?? -1;
  if (indexForResource < 0) {
    throw new ResourceDependencyError(
      `Missing resource: "${type}" has dependencies so must not be missing`
    );
  }

  // find tuples index for all the dependency elements
  const dependencyIndexTuples = depends.map(
    dependency =>
      [dependency, tuples!.findIndex(matchType({ type: dependency }))] as const
  );

  // we rely on executing tuples including all dependencies of the caller resource
  dependencyIndexTuples.forEach(([dependency, index]) => {
    if (index < 0) {
      throw new ResourceDependencyError(
        `Missing resource: "${type}" depends "${dependency}" which is missing`
      );
    }
    if (index > indexForResource) {
      throw new ResourceDependencyError(
        `Illegal dependency: "${type}" depends "${dependency}" so "${dependency}" must precede "${type}"`
      );
    }
  });

  return fromEntries(
    dependencyIndexTuples.map(([dependency, index]) => {
      const [{ getKey }] = tuples![index];

      return [
        dependency,
        getSliceForResource(
          { data },
          {
            type: dependency,
            key: getKey(routerStoreContext, resourceStoreContext),
          }
        ),
      ];
    })
  );
};
