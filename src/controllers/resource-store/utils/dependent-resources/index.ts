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

export const executeTuples =
  <R>(
    routeResources: RouteResource[] | null | undefined,
    tuples: ExecutionTuple[]
  ): ResourceAction<R[]> =>
  ({ getState, setState, dispatch }) => {
    if (getState().executing) {
      throw new Error('execution is already in progress');
    }

    // check if there are resources and if so if there are any resources with dependencies
    const hasDependentResources =
      routeResources?.some(({ depends }) => depends?.length) ?? false;

    if (!hasDependentResources) {
      return tuples.map(([, action]) => dispatch(action));
    }

    // some resources might not be listed on the route resources so must be dispatched separate from executing state
    const listedTuples = tuples.filter(([resource]) =>
      routeResources?.some(matchType(resource))
    );
    if (listedTuples.length === 0) {
      return tuples.map(([, action]) => dispatch(action));
    }

    // accumulate the dependency types for all executing resources
    // find downstream resources that may also execute and include their dependencies too
    // include the resource type as well in the list
    // we don't validate that these are legal dependencies
    const [dependentTypes] = routeResources!
      .reduce(
        (acc, { type, depends }) => {
          const [dependencies, executableTypes] = acc;
          const isExecutable =
            executableTypes.includes(type) ||
            !!depends?.some(dependency => executableTypes.includes(dependency));

          return isExecutable
            ? [
                depends ? [...dependencies, ...depends, type] : dependencies,
                [...executableTypes, type],
              ]
            : acc;
        },
        [[] as ResourceType[], listedTuples.map(([{ type }]) => type)]
      )
      .filter((v, i, a) => a.indexOf(v) === i);

    // resources that are completely independent are preferable to be dispatched separate from executing state
    const dependentTuples = listedTuples.filter(([{ type }]) =>
      dependentTypes.includes(type)
    );
    if (dependentTuples.length === 0) {
      return tuples.map(([, action]) => dispatch(action));
    }

    // additionally find all direct dependencies of these executing or possibly executing resources
    // we don't validate that these are legal dependencies
    const dependentAndDependencyTypes = routeResources!
      .filter(({ type }) => dependentTypes.includes(type))
      .reduce(
        (acc, { type, depends }) =>
          depends ? [...acc, ...depends, type] : [...acc, type],
        [] as ResourceType[]
      )
      .filter((v, i, a) => a.indexOf(v) === i);

    // setup executing tuples in route resource order
    // this state allows actions to call executeForDependents() to influence actions that follow
    // the list includes dependency resources so that getDependencies() may validate without needing route resources
    // we use the resource definition of the given tuple where present or otherwise the definition from route resources
    const executingTuples = routeResources!
      .filter(({ type }) => dependentAndDependencyTypes.includes(type))
      .map(
        resource =>
          tuples.find(matchType(resource)) ??
          ([resource, null] as ExecutionMaybeTuple)
      );

    setState({ executing: executingTuples });

    // dispatch sequentially during which executeForDependents() can cause tuples to change
    const executedResults = executingTuples.map(
      ([{ type: expectedType }], i) => {
        const latestTuple = getState().executing?.[i];
        const [{ type: latestType }, maybeAction] = latestTuple ?? [{}];

        if (latestType !== expectedType) {
          setState({ executing: null });
          throw new Error('execution reached an inconsistent state');
        }

        return maybeAction ? dispatch(maybeAction) : undefined;
      }
    );

    setState({ executing: null });

    // pick existing execution result or dispatch any remaining independent actions
    return tuples.map(([resource, action]) => {
      const index = executingTuples.findIndex(matchType(resource));

      return index < 0 ? dispatch(action) : executedResults[index];
    });
  };

export const actionWithDependencies =
  <R extends unknown>(
    routeResources: RouteResource[] | undefined,
    resource: RouteResource,
    action: ResourceAction<R>
  ): ResourceAction<R> =>
  ({ dispatch }) =>
    dispatch(executeTuples<R>(routeResources, [[resource, action]]))[0];

export const mapActionWithDependencies = <R extends unknown>(
  routeResources: RouteResource[] | undefined,
  resources: RouteResource[],
  actionCreator: (resource: RouteResource) => ResourceAction<R>
): ResourceAction<R[]> =>
  executeTuples<R>(
    routeResources,
    resources.map(resource => [resource, actionCreator(resource)])
  );

export const executeForDependents =
  <R extends unknown>(
    resource: RouteResource,
    actionCreator: (r: RouteResource) => ResourceAction<R>
  ): ResourceAction<void> =>
  ({ getState, setState }) => {
    const { executing: tuples } = getState();

    // find the given resource in the currently executing tuples
    const indexForResource = tuples?.findIndex(matchType(resource)) ?? -1;
    if (indexForResource < 0) {
      return;
    }

    // find dependent resources following given resource and revise their action
    const executing = tuples!.map((tuple, i): ExecutionMaybeTuple => {
      const [tupleResource] = tuple;

      return i > indexForResource &&
        tupleResource.depends?.includes(resource.type)
        ? [tupleResource, actionCreator(tupleResource)]
        : tuple;
    });

    setState({ executing });
  };

export const getDependencies =
  (
    resource: RouteResource,
    routerStoreContext: RouterContext
  ): ResourceAction<ResourceDependencies> =>
  ({ getState }) => {
    const { type, depends } = resource;

    // optimise the case of no dependencies
    if (!depends?.length) {
      return {};
    }

    const {
      executing: tuples,
      data,
      context: resourceStoreContext,
    } = getState();

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
        [
          dependency,
          tuples!.findIndex(matchType({ type: dependency })),
        ] as const
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
