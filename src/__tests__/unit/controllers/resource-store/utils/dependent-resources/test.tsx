import React from 'react';
import { StoreActionApi } from 'react-sweet-state';
import {
  executeTuples,
  executeForDependents,
  getDependencies,
  ResourceDependencyError,
} from '../../../../../../controllers/resource-store/utils/dependent-resources';
import {
  ResourceType,
  RouteResource,
  RouteResourceResponseBase,
} from '../../../../../../common/types';
import { State } from '../../../../../../controllers/resource-store/types';
import { createResource } from '../../../../../../controllers/resource-utils';

describe('dependent resources', () => {
  const mockRoute = {
    name: 'foo',
    path: '/foo',
    component: () => <h1>test</h1>,
    resources: [],
  };
  const mockMatch = {
    params: {},
    query: {},
    isExact: false,
    path: '',
    url: '',
  };
  const mockRouterStoreContext = {
    route: mockRoute,
    match: mockMatch,
    query: {},
  };
  const getKey = () => 'key';
  const getData = () => {};

  const toResource = (
    type: ResourceType,
    depends: ResourceType[] | undefined = undefined
  ) => createResource({ type, depends, getKey, getData });

  const resourceA = toResource('a');
  const resourceB = toResource('b');

  const resourceX = toResource('x');
  const resourceY = toResource('y', ['x', 'y']); // depends on self too
  const resourceZ = toResource('z', ['x', 'y']);

  const createApi = (state: Partial<State>) => {
    const currentState: Partial<State> = state;
    const api: StoreActionApi<State> = {
      getState: jest.fn(() => currentState) as () => State,
      setState: jest.fn(v => {
        Object.assign(currentState, v);
      }) as (state: Partial<State>) => undefined,
      dispatch: jest.fn(action => action(api, {})),
    };

    return api;
  };

  describe('executeTuples', () => {
    it('should throw where there is existing executing state', () => {
      const mockApi = createApi({ executing: [] });

      expect(() => executeTuples([resourceA, resourceB], [])(mockApi)).toThrow(
        'execution is already in progress'
      );
    });

    it('should separately dispatch independent resources without creating executing state', () => {
      const mockApi = createApi({ executing: null });
      const action = jest.fn().mockReturnValueOnce(1).mockReturnValueOnce(2);

      expect(
        executeTuples(
          [resourceA, resourceB],
          [
            [resourceA, action],
            [resourceX, action],
          ]
        )(mockApi)
      ).toEqual([1, 2]);

      expect(mockApi.setState).not.toBeCalled();
      expect(mockApi.dispatch).toHaveBeenCalledTimes(2);
      expect(action).toBeCalledTimes(2);
    });

    it('should dispatch independent resources even if missing from current route', () => {
      const mockApi = createApi({ executing: null });
      const action = jest.fn().mockReturnValueOnce(1).mockReturnValueOnce(2);

      expect(
        executeTuples(
          [],
          [
            [resourceA, action],
            [resourceB, action],
          ]
        )(mockApi)
      ).toEqual([1, 2]);

      expect(mockApi.setState).not.toBeCalled();
      expect(mockApi.dispatch).toHaveBeenCalledTimes(2);
      expect(action).toBeCalledTimes(2);
    });

    it.each([
      ['missing from current route resources', []],
      ['current route resources are invalid (null)', null],
      ['current route resources are invalid (undefined)', undefined],
    ])(
      'should dispatch independent resources even if %s',
      (_label, routeResources) => {
        const mockApi = createApi({ executing: null });
        const action = jest.fn().mockReturnValueOnce(1).mockReturnValueOnce(2);

        expect(
          executeTuples(routeResources, [
            [resourceA, action],
            [resourceB, action],
          ])(mockApi)
        ).toEqual([1, 2]);

        expect(mockApi.setState).not.toBeCalled();
        expect(mockApi.dispatch).toHaveBeenCalledTimes(2);
        expect(action).toBeCalledTimes(2);
      }
    );

    it.each([
      ['missing from current route resources', []],
      ['current route resources are invalid (null)', null],
      ['current route resources are invalid (undefined)', undefined],
    ])(
      'should dispatch dependent resources as independent if %s',
      (_label, routeResources) => {
        const mockApi = createApi({ executing: null });
        const action = jest.fn().mockReturnValueOnce(1).mockReturnValueOnce(2);

        expect(
          executeTuples(routeResources, [
            [resourceY, action],
            [resourceZ, action],
          ])(mockApi)
        ).toEqual([1, 2]);

        expect(mockApi.setState).not.toBeCalled();
        expect(mockApi.dispatch).toHaveBeenCalledTimes(2);
        expect(action).toBeCalledTimes(2);
      }
    );

    it('should construct an executing state of executing resources and their dependencies', () => {
      const mockApi = createApi({ executing: null });
      const action = jest.fn().mockReturnValue(1);

      expect(
        executeTuples(
          [resourceA, resourceB, resourceX, resourceY],
          [[resourceY, action]]
        )(mockApi)
      ).toEqual([1]);

      expect(mockApi.setState).toBeCalledTimes(2);
      expect(mockApi.setState).toHaveBeenNthCalledWith(1, {
        executing: [
          [resourceX, null],
          [resourceY, action],
        ],
      });
      expect(mockApi.dispatch).toHaveBeenCalledTimes(1);
      expect(action).toBeCalledTimes(1);
      expect(mockApi.setState).toHaveBeenNthCalledWith(2, { executing: null });
    });

    it('should construct an executing state of executing resources and their dependents', () => {
      const mockApi = createApi({ executing: null });
      const action = jest.fn().mockReturnValue(1);

      expect(
        executeTuples(
          [resourceA, resourceB, resourceX, resourceY],
          [[resourceX, action]]
        )(mockApi)
      ).toEqual([1]);

      expect(mockApi.setState).toBeCalledTimes(2);
      expect(mockApi.setState).toHaveBeenNthCalledWith(1, {
        executing: [
          [resourceX, action],
          [resourceY, null],
        ],
      });
      expect(mockApi.dispatch).toHaveBeenCalledTimes(1);
      expect(action).toBeCalledTimes(1);
      expect(mockApi.setState).toHaveBeenNthCalledWith(2, { executing: null });
    });

    it('should presume execution mutates executing state and dispatch action from most recent state', () => {
      const mockApi = createApi({ executing: null });
      const action2 = jest.fn().mockReturnValue(2);
      const action1 = jest.fn(() => {
        mockApi.setState({
          executing: [
            [resourceX, action1],
            [resourceY, action2],
          ],
        });

        return 1;
      });

      expect(
        executeTuples(
          [resourceA, resourceB, resourceX, resourceY],
          [[resourceX, action1]]
        )(mockApi)
      ).toEqual([1]);

      expect(mockApi.setState).toBeCalledTimes(3);
      expect(mockApi.setState).toHaveBeenNthCalledWith(1, {
        executing: [
          [resourceX, action1],
          [resourceY, null],
        ],
      });
      expect(mockApi.setState).toHaveBeenNthCalledWith(2, {
        executing: [
          [resourceX, action1],
          [resourceY, action2],
        ],
      });
      expect(mockApi.dispatch).toHaveBeenCalledTimes(2);
      expect(action1).toBeCalledTimes(1);
      expect(action2).toBeCalledTimes(1);
      expect(mockApi.setState).toHaveBeenNthCalledWith(3, { executing: null });
    });

    it('should remove execution state and throw if executing state is mutated inconsistently', () => {
      const mockApi = createApi({ executing: null });
      const action2 = jest.fn().mockReturnValue(2);
      const action1 = jest.fn(() => {
        mockApi.setState({
          executing: [
            [resourceX, action1],
            [resourceZ, action2],
          ],
        });

        return 1;
      });

      expect(() =>
        executeTuples(
          [resourceA, resourceB, resourceX, resourceY],
          [[resourceX, action1]]
        )(mockApi)
      ).toThrow('execution reached an inconsistent state');

      expect(mockApi.setState).toBeCalledTimes(3);
      expect(mockApi.setState).toHaveBeenNthCalledWith(1, {
        executing: [
          [resourceX, action1],
          [resourceY, null],
        ],
      });
      expect(mockApi.setState).toHaveBeenNthCalledWith(2, {
        executing: [
          [resourceX, action1],
          [resourceZ, action2],
        ],
      });
      expect(mockApi.dispatch).toHaveBeenCalledTimes(1);
      expect(action1).toBeCalledTimes(1);
      expect(action2).not.toBeCalled();
      expect(mockApi.setState).toHaveBeenNthCalledWith(3, { executing: null });
    });

    it('should execute independent and dependent resources separately regardless of given tuple order', () => {
      const mockApi = createApi({ executing: null });
      const action = jest
        .fn()
        .mockReturnValueOnce(1)
        .mockReturnValueOnce(2)
        .mockReturnValueOnce(3)
        .mockReturnValueOnce(4);

      expect(
        executeTuples(
          [resourceA, resourceB, resourceX, resourceY],
          [
            [resourceA, action],
            [resourceX, action],
            [resourceB, action],
            [resourceY, action],
          ]
        )(mockApi)
      ).toEqual([1, 3, 2, 4]);
    });
  });

  describe('executeForDependents', () => {
    it('should do nothing outside of executing state', () => {
      const mockApi = createApi({ executing: null });
      const actionCreator = jest.fn().mockReturnValueOnce(1);

      executeForDependents(resourceX, actionCreator)(mockApi);

      expect(mockApi.getState).toBeCalled();
      expect(mockApi.setState).not.toBeCalled();
      expect(actionCreator).not.toBeCalled();
    });

    it('should do nothing where given resource is not executing', () => {
      const mockApi = createApi({
        executing: [
          [resourceY, null],
          [resourceZ, null],
        ],
      });
      const actionCreator = jest.fn().mockReturnValue(1);

      executeForDependents(resourceX, actionCreator)(mockApi);

      expect(mockApi.getState).toBeCalled();
      expect(mockApi.setState).not.toBeCalled();
      expect(actionCreator).not.toBeCalled();
    });

    it('should revise action for resources in executing state dependent on the given resource', () => {
      const mockApi = createApi({
        executing: [
          [resourceX, null],
          [resourceY, null],
          [resourceZ, null],
        ],
      });
      const actionCreator = jest
        .fn()
        .mockReturnValueOnce(1)
        .mockReturnValueOnce(2);

      executeForDependents(resourceX, actionCreator)(mockApi);

      expect(mockApi.getState).toBeCalled();
      expect(mockApi.setState).toBeCalledWith({
        executing: [
          [resourceX, null],
          [resourceY, 1],
          [resourceZ, 2],
        ],
      });
      expect(actionCreator).toBeCalledTimes(2);
      expect(actionCreator).toHaveBeenNthCalledWith(1, resourceY);
      expect(actionCreator).toHaveBeenNthCalledWith(2, resourceZ);
    });

    it('should not revise action for itself where given resource is a self dependent', () => {
      const mockApi = createApi({
        executing: [
          [resourceX, null],
          [resourceY, null],
        ],
      });
      const actionCreator = jest.fn().mockReturnValue(1);

      executeForDependents(resourceY, actionCreator)(mockApi);

      expect(mockApi.getState).toBeCalled();
      expect(mockApi.setState).toBeCalledWith({
        executing: [
          [resourceX, null],
          [resourceY, null],
        ],
      });
      expect(actionCreator).not.toHaveBeenCalled();
    });

    it('should not revise action for resources preceding the given resource in executing state', () => {
      const mockApi = createApi({
        executing: [
          [resourceZ, null],
          [resourceX, null],
          [resourceY, null],
        ],
      });
      const actionCreator = jest.fn().mockReturnValue(1);

      executeForDependents(resourceX, actionCreator)(mockApi);

      expect(mockApi.getState).toBeCalled();
      expect(mockApi.setState).toBeCalledWith({
        executing: [
          [resourceZ, null],
          [resourceX, null],
          [resourceY, 1],
        ],
      });
      expect(actionCreator).toBeCalledTimes(1);
      expect(actionCreator).toBeCalledWith(resourceY);
    });
  });

  describe('getDependencies', () => {
    const slice1 = { data: 1 } as RouteResourceResponseBase<number>;
    const slice2 = { data: 2 } as RouteResourceResponseBase<number>;

    it('should return empty object where given resource has no dependencies', () => {
      const mockApi = createApi({ executing: [] });

      expect(
        getDependencies(
          { depends: null } as RouteResource,
          mockRouterStoreContext
        )(mockApi)
      ).toEqual({});

      expect(
        getDependencies(
          { depends: [] as ResourceType[] } as RouteResource,
          mockRouterStoreContext
        )(mockApi)
      ).toEqual({});

      expect(mockApi.getState).not.toBeCalled();
    });

    it('should return null where called outside of executing state', () => {
      const mockApi = createApi({ executing: null });

      expect(() =>
        getDependencies(resourceY, mockRouterStoreContext)(mockApi)
      ).toThrow(
        new ResourceDependencyError(
          'Missing resource: "y" has dependencies so must not be missing'
        )
      );

      expect(mockApi.getState).toBeCalled();
    });

    it('should throw ResourceDependencyError where given dependent resource is not in executing state', () => {
      const mockApi = createApi({
        executing: [
          [resourceX, null],
          [resourceY, null],
        ],
      });

      expect(() =>
        getDependencies(resourceZ, mockRouterStoreContext)(mockApi)
      ).toThrow(
        new ResourceDependencyError(
          'Missing resource: "z" has dependencies so must not be missing'
        )
      );

      expect(mockApi.getState).toBeCalled();
    });

    it('should throw ResourceDependencyError for first dependency missing from executing state', () => {
      const mockApi = createApi({
        data: {
          x: { key: slice1 },
          y: { key: slice2 },
        },
        executing: [
          [resourceX, null],
          [resourceY, null],
        ],
      });

      expect(() =>
        getDependencies(
          { ...resourceY, depends: ['a', 'b'] } as RouteResource,
          mockRouterStoreContext
        )(mockApi)
      ).toThrow(
        new ResourceDependencyError(
          'Missing resource: "y" depends "a" which is missing'
        )
      );

      expect(() =>
        getDependencies(
          { ...resourceY, depends: ['a', 'x'] } as RouteResource,
          mockRouterStoreContext
        )(mockApi)
      ).toThrow(
        new ResourceDependencyError(
          'Missing resource: "y" depends "a" which is missing'
        )
      );

      expect(() =>
        getDependencies(
          { ...resourceY, depends: ['y', 'b'] } as RouteResource,
          mockRouterStoreContext
        )(mockApi)
      ).toThrow(
        new ResourceDependencyError(
          'Missing resource: "y" depends "b" which is missing'
        )
      );

      expect(mockApi.getState).toBeCalled();
      expect(mockApi.setState).not.toBeCalled();
    });

    it('should return {type:slice} for dependencies preceding given resource in executing state', () => {
      const mockApi = createApi({
        data: {
          x: { key: slice1 },
          y: { key: slice2 },
        },
        executing: [
          [resourceX, null],
          [resourceY, null],
          [resourceZ, null],
        ],
      });

      expect(
        getDependencies(resourceZ, mockRouterStoreContext)(mockApi)
      ).toEqual({
        x: slice1,
        y: slice2,
      });

      expect(mockApi.getState).toBeCalled();
      expect(mockApi.setState).not.toBeCalledWith({});
    });

    it('should return {type:own-slice} where given resource is self dependent', () => {
      const mockApi = createApi({
        data: {
          x: { key: slice1 },
          y: { key: slice2 },
        },
        executing: [
          [resourceX, null],
          [resourceY, null],
        ],
      });

      expect(
        getDependencies(resourceY, mockRouterStoreContext)(mockApi)
      ).toEqual({
        x: slice1,
        y: slice2,
      });

      expect(mockApi.getState).toBeCalled();
      expect(mockApi.setState).not.toBeCalled();
    });

    it('should throw ResourceDependencyError for first dependency following given resource in executing state', () => {
      const mockApi = createApi({
        data: {
          x: { key: slice1 },
          y: { key: slice2 },
        },
        executing: [
          [resourceY, null],
          [resourceX, null],
        ],
      });

      expect(() =>
        getDependencies(resourceY, mockRouterStoreContext)(mockApi)
      ).toThrow(
        new ResourceDependencyError(
          'Illegal dependency: "y" depends "x" so "x" must precede "y"'
        )
      );

      expect(mockApi.getState).toBeCalled();
      expect(mockApi.setState).not.toBeCalled();
    });
  });
});
