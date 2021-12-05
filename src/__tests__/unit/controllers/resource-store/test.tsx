/* eslint-disable prefer-destructuring */
/* eslint-disable prefer-promise-reject-errors */
import React from 'react';

import { mount } from 'enzyme';
import { BoundActions, defaultRegistry } from 'react-sweet-state';

import { useResource } from '../../../../controllers/hooks';
import { getResourceStore } from '../../../../controllers/resource-store';
import { BASE_DEFAULT_STATE_SLICE } from '../../../../controllers/resource-store/constants';
import { getSliceForResource } from '../../../../controllers/resource-store/selectors';
import {
  Actions as ResourceStoreActions,
  State as ResourceStoreState,
} from '../../../../controllers/resource-store/types';
import {
  getAccessedAt,
  getDefaultStateSlice,
  getExpiresAt,
  serializeError,
  shouldUseCache,
  TimeoutError,
} from '../../../../controllers/resource-store/utils';
import { createResource } from '../../../../controllers/resource-utils';
import * as routerStoreModule from '../../../../controllers/router-store';

jest.mock('../../../../controllers/resource-store/utils', () => ({
  ...jest.requireActual<any>('../../../../controllers/resource-store/utils'),
  shouldUseCache: jest.fn(),
  getExpiresAt: jest.fn(),
  getDefaultStateSlice: jest.fn(),
  getAccessedAt: jest.fn(),
}));

describe('resource store', () => {
  let resourceStore;
  let storeState: any;
  let actions: BoundActions<ResourceStoreState, ResourceStoreActions>;

  beforeEach(() => {
    resourceStore = getResourceStore();
    storeState = resourceStore.storeState;
    actions = resourceStore.actions;
  });

  afterEach(() => {
    defaultRegistry.stores.clear();
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  const type = 'type';
  const key = 'key';
  const result = 'result';
  const error = null;
  const expiresAt = 0;
  const accessedAt = 100;
  const getDataPromise = Promise.resolve(result);
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
  const mockOptions = {};
  const mockResource = createResource({
    type,
    getKey: () => key,
    getData: () => getDataPromise,
  });
  const resolver = (resolveWith: any, delay = 0) =>
    new Promise(resolve => setTimeout(() => resolve(resolveWith), delay));

  describe('when cached data will not be used', () => {
    beforeEach(() => {
      (shouldUseCache as any).mockImplementation(() => false);
      (getExpiresAt as any).mockImplementation(() => expiresAt);
      (getAccessedAt as any).mockImplementation(() => accessedAt);
      (getDefaultStateSlice as any).mockImplementation(() => ({
        ...BASE_DEFAULT_STATE_SLICE,
        expiresAt,
      }));
    });

    describe('getResource', () => {
      const otherType = 'foo';
      const mockKeyedData = {
        bar: { data: 'baz', loading: false, error, promise: null },
      };

      it('should return the resolved response', async () => {
        const response = await actions.getResource(
          mockResource,
          mockRouterStoreContext,
          mockOptions
        );

        expect(response).toEqual({
          data: result,
          error,
          loading: false,
          promise: getDataPromise,
          expiresAt,
          accessedAt,
        });
      });

      it('should merge new data into old data', async () => {
        const oldData = { [otherType]: mockKeyedData };

        storeState.setState({ data: oldData });

        await actions.getResource(
          mockResource,
          mockRouterStoreContext,
          mockOptions
        );

        expect(storeState.getState()).toEqual({
          data: {
            ...oldData,
            [type]: {
              [key]: {
                data: result,
                loading: false,
                error,
                promise: getDataPromise,
                expiresAt,
                accessedAt,
              },
            },
          },
        });
      });

      it('should respect timeout option', async () => {
        const response = await actions.getResource(
          createResource({
            type,
            getKey: () => key,
            getData: () => resolver('hello world', 250),
          }),
          mockRouterStoreContext,
          {
            timeout: 100,
          }
        );

        expect(response).toEqual({
          data: null,
          error: new TimeoutError(type),
          loading: true,
          promise: null,
          expiresAt: expect.any(Number),
          accessedAt: expect.any(Number),
        });
      });

      it('should merge new data for the type and into old data for the type', async () => {
        const oldData = {
          [type]: mockKeyedData,
        };

        storeState.setState({ data: oldData });

        await actions.getResource(
          mockResource,
          mockRouterStoreContext,
          mockOptions
        );

        expect(storeState.getState().data[type]).toEqual({
          [key]: {
            data: result,
            loading: false,
            error,
            promise: getDataPromise,
            expiresAt,
            accessedAt,
          },
          ...mockKeyedData,
        });
      });

      it('should call setState the correct number of times with the correct payloads', async () => {
        const spy = jest.spyOn(storeState, 'setState');

        await actions.getResource(
          mockResource,
          mockRouterStoreContext,
          mockOptions
        );

        expect(spy).toBeCalledTimes(2);
        expect(spy).toHaveBeenNthCalledWith(1, {
          context: {},
          data: {
            [type]: {
              [key]: {
                data: null,
                loading: true,
                error,
                promise: getDataPromise,
                expiresAt,
                accessedAt,
              },
            },
          },
        });
        expect(spy).toHaveBeenNthCalledWith(2, {
          context: {},
          data: {
            [type]: {
              [key]: {
                data: result,
                loading: false,
                error,
                promise: getDataPromise,
                expiresAt,
                accessedAt,
              },
            },
          },
        });
      });

      it('should not replace cached data if it exists and the promise throws an error', async () => {
        const oldResource = {
          ...mockResource,
          getData: () => Promise.resolve({ message: 'cached' }),
          maxAge: 30 * 1000,
        };
        const newResourceThatWillError = {
          ...mockResource,
          getData: () => Promise.reject('some reason'),
          maxAge: 30 * 1000,
        };

        await actions.getResource(
          oldResource,
          mockRouterStoreContext,
          mockOptions
        );

        const { data } = storeState.getState().data[type][key];

        await actions.getResource(
          newResourceThatWillError,
          mockRouterStoreContext,
          mockOptions
        );

        expect(storeState.getState().data[type][key].data).toEqual(data);
      });

      describe('when the resource has a maxAge of 0', () => {
        it('should set data and error to null before fetching fresh data', async () => {
          const spy = jest.spyOn(storeState, 'setState');

          const oldData = {
            [type]: {
              [key]: {
                data: 'some-data',
                error: 'some-error',
                loading: false,
              },
            },
          };

          storeState.setState({ data: oldData });

          await actions.getResource(
            {
              ...mockResource,
              maxAge: 0,
            },
            mockRouterStoreContext,
            mockOptions
          );

          // resetting the slice
          expect(spy).toHaveBeenCalledWith({
            data: {
              [type]: {
                [key]: {
                  data: null,
                  error: null,
                  loading: true,
                  promise: getDataPromise,
                  accessedAt,
                },
              },
            },
          });

          // populating the store with the new slice
          expect(spy).toHaveBeenCalledWith({
            data: {
              [type]: {
                [key]: {
                  data: result,
                  error: null,
                  expiresAt,
                  loading: false,
                  promise: getDataPromise,
                  accessedAt,
                },
              },
            },
          });
        });
      });
    });
    describe('requestAllResources', () => {
      const routeWithMockedResources = {
        resources: [
          {
            ...mockResource,
            ...{ type: 'HI', getData: () => resolver('hello world', 250) },
          },
          {
            ...mockResource,
            ...{
              type: 'BYE',
              getData: () => resolver('goodbye cruel world', 500),
            },
          },
        ],
      };

      it('should resolve with an empty array if there is no route match', async () => {
        const data = actions.requestAllResources(mockRouterStoreContext);

        expect(data).toEqual(expect.arrayContaining([]));
      });

      it('should request all the resources for a route when awaited', async () => {
        jest.spyOn(routerStoreModule, 'getRouterState').mockReturnValue({
          // @ts-ignore mocks
          route: routeWithMockedResources,
        });

        await actions.requestAllResources({
          ...mockRouterStoreContext,
          // @ts-ignore - we're just doing a partial mock for a route
          route: routeWithMockedResources,
        });
        const state = storeState.getState();

        expect(state).toEqual({
          context: {},
          data: {
            BYE: {
              key: {
                data: 'goodbye cruel world',
                error: null,
                loading: false,
                promise: resolver('hello world'),
                expiresAt,
                accessedAt,
              },
            },
            HI: {
              key: {
                data: 'hello world',
                error: null,
                loading: false,
                promise: resolver('goodbye cruel world'),
                expiresAt,
                accessedAt,
              },
            },
          },
        });
      });
    });
  });

  describe('requestResources', () => {
    it('should skip isBrowserOnly resources if isStatic is true', () => {
      const data = actions.requestResources(
        [{ ...mockResource, isBrowserOnly: true }],
        mockRouterStoreContext,
        { ...mockOptions, isStatic: true }
      );

      expect(data).toEqual([]);
    });
    it('should ignore isBrowserOnly if isStatic is falsey', async () => {
      (getDefaultStateSlice as any).mockImplementation(() => ({
        ...BASE_DEFAULT_STATE_SLICE,
        expiresAt: 1,
      }));

      await Promise.all(
        actions.requestResources(
          [{ ...mockResource, isBrowserOnly: true }],
          mockRouterStoreContext,
          mockOptions
        )
      );

      const { data } = storeState.getState();

      expect(data).toEqual({
        type: {
          key: {
            accessedAt: undefined,
            data: 'result',
            error: null,
            expiresAt: undefined,
            loading: false,
            promise: expect.any(Promise),
          },
        },
      });
    });
  });

  describe('getSafeData', () => {
    const slice = {
      data: { hello: 'world' },
      loading: false,
      error: null,
      expiresAt: 14400222,
    };

    it('should get safe data with properly hydratable errors if error was a string', () => {
      storeState.setState({
        data: {
          [type]: {
            [key]: { ...slice, error: 'I am an error string' },
          },
        },
      });

      const safeData = actions.getSafeData();

      expect(safeData[type][key].error).toEqual({
        name: 'Error',
        message: '"I am an error string"',
        stack: expect.any(String),
      });
    });

    it('should maintain null errors', () => {
      storeState.setState({
        data: {
          [type]: {
            [key]: { ...slice },
          },
        },
      });

      const safeData = actions.getSafeData();

      expect(safeData[type][key].error).toBeNull();
    });

    it('should set the expiresAt property to null', () => {
      storeState.setState({
        data: {
          [type]: {
            [key]: { ...slice },
          },
        },
      });

      const safeData = actions.getSafeData();

      expect(safeData[type][key].expiresAt).toBeNull();
    });

    it('should set loading to false for completed resource', () => {
      storeState.setState({
        data: {
          [type]: {
            [key]: { ...slice, loading: true },
          },
        },
      });

      const safeData = actions.getSafeData();

      expect(safeData[type][key].loading).toBeFalsy();
    });

    it('should set loading to true for timed out resource', () => {
      storeState.setState({
        data: {
          [type]: {
            [key]: { ...slice, error: new TimeoutError(type), loading: true },
          },
        },
      });

      const safeData = actions.getSafeData();

      expect(safeData[type][key].loading).toBeTruthy();
    });
  });

  describe('hydrate', () => {
    it('should not set either data or context if they are supplied as undefined', () => {
      const state = { resourceData: undefined, resourceContext: undefined };

      actions.hydrate(state);

      const { context, data } = storeState.getState();

      expect(context).toEqual({});
      expect(data).toEqual({});
    });

    it('should set the context if it is provided', () => {
      const resourceContext = { foo: 'bar' };

      actions.hydrate({ resourceContext });

      const { context } = storeState.getState();

      expect(context).toEqual(resourceContext);
    });

    it('should set the data if it is provided', () => {
      const resourceData = {
        HI: {
          key: {
            data: 'hello world',
            error: null,
            loading: false,
            promise: null,
            expiresAt: null,
            accessedAt,
          },
        },
      };

      // @ts-ignore mocking resourceData
      actions.hydrate({ resourceData });

      const { data } = storeState.getState();

      expect(data).toEqual(resourceData);
    });

    it('should hydrate serialized errors correctly', () => {
      const message = 'test';
      const resourceData = {
        [type]: {
          [key]: {
            data: null,
            error: serializeError(new Error(message)),
            loading: false,
            promise: null,
            expiresAt: null,
            accessedAt: null,
          },
        },
      };

      actions.hydrate({ resourceData });

      const { data: hydrated } = storeState.getState();
      const hydratedError = hydrated[type][key].error;

      expect(hydratedError.message).toEqual(message);
      expect(hydratedError.name).toEqual('Error');
      expect(hydratedError.stack).toBeDefined();
    });

    it('should hydrate custom serialized errors correctly', () => {
      class CustomError extends Error {
        component: string;

        // @ts-ignore
        constructor({ name, message, component }) {
          super(message);

          this.name = name;
          this.component = component;
        }
      }

      const customErrorProps = {
        name: 'custom',
        message: 'this is a custom error message',
        component: 'test.component',
      };
      const resourceData = {
        [type]: {
          [key]: {
            data: null,
            error: serializeError(new CustomError(customErrorProps)),
            loading: false,
            promise: null,
            expiresAt: null,
            accessedAt: null,
          },
        },
      };

      actions.hydrate({ resourceData });

      const { data: hydrated } = storeState.getState();
      const hydratedError = hydrated[type][key].error;

      expect(hydratedError instanceof Error).toBe(true);
      expect(hydratedError.message).toEqual(customErrorProps.message);
      expect(hydratedError.name).toEqual(customErrorProps.name);
      expect(hydratedError.component).toEqual(customErrorProps.component);
      expect(hydratedError.stack).toBeDefined();
    });
  });

  describe('when cached data will be used', () => {
    beforeEach(() => {
      (shouldUseCache as any).mockImplementation(() => true);
    });

    it('should not call getData if the cached resource is fresh', async () => {
      storeState.setState({
        data: {
          [type]: {
            [key]: {
              data: result,
              loading: false,
              error,
              promise: null,
              expiresAt: null,
              accessedAt,
            },
          },
        },
      });

      const getDataSpy = jest.spyOn(mockResource, 'getData');

      await actions.getResource(
        mockResource,
        mockRouterStoreContext,
        mockOptions
      );

      expect(getDataSpy).toHaveBeenCalledTimes(0);
    });

    it('should update the slice with an expiresAt value and set this in store state when the slice comes from ssr', async () => {
      storeState.setState({
        data: {
          [type]: {
            [key]: {
              data: result,
              loading: false,
              error,
              promise: getDataPromise,
              expiresAt: null,
              accessedAt,
            },
          },
        },
      });

      const slice = await actions.getResource(
        mockResource,
        mockRouterStoreContext,
        mockOptions
      );

      expect(slice.expiresAt === null).toBeFalsy();
      expect(storeState.getState().expiresAt === null).toBeFalsy();
    });
  });

  describe('when max cache limit is set', () => {
    const mockSlice = {
      ...BASE_DEFAULT_STATE_SLICE,
      expiresAt: 100,
    };

    const home = 'home';
    const about = 'about';

    const initialDataForType = {
      [home]: {
        ...mockSlice,
        data: home,
        accessedAt: 100,
      },
      [about]: {
        ...mockSlice,
        data: about,
        accessedAt: 200,
      },
    };

    const currentTime = 500;
    const expiryAge = 1000;

    beforeEach(() => {
      jest.spyOn(global.Date, 'now').mockReturnValue(currentTime);
      (getDefaultStateSlice as any).mockImplementation(() => mockSlice);
      (getExpiresAt as any).mockImplementation((age: number) => age);
      (getAccessedAt as any).mockImplementation(() => 400);
    });
    it('should store data in cache along with previous data when max cache limit not reached', async () => {
      storeState.setState({
        data: {
          [type]: {
            ...initialDataForType,
          },
        },
      });
      await actions.getResource(
        {
          ...mockResource,
          maxAge: expiryAge,
          maxCache: 3,
        },
        mockRouterStoreContext,
        mockOptions
      );

      expect(storeState.getState()).toEqual({
        data: {
          [type]: {
            ...initialDataForType,
            [key]: {
              data: result,
              loading: false,
              error,
              promise: getDataPromise,
              expiresAt: expiryAge,
              accessedAt: 400,
            },
          },
        },
      });
    });
    it('should delete the least recent key data when cache reaches the max cache limit for the Type', async () => {
      storeState.setState({
        data: {
          [type]: {
            ...initialDataForType,
          },
        },
      });
      await actions.getResource(
        {
          ...mockResource,
          maxAge: expiryAge,
          maxCache: 2,
        },
        mockRouterStoreContext,
        mockOptions
      );
      expect(storeState.getState()).toEqual({
        data: {
          [type]: {
            [about]: {
              ...initialDataForType[about],
            },
            [key]: {
              data: result,
              loading: false,
              error,
              promise: getDataPromise,
              expiresAt: expiryAge,
              accessedAt: 400,
            },
          },
        },
      });
    });
  });

  describe('useResource', () => {
    it('should render a loading component if using a resource that has not yet been resolved', () => {
      const id = 'test';

      storeState.setState({
        data: {
          [type]: {
            [key]: {
              data: { id },
              loading: false,
              error: null,
              promise: null,
              accessedAt,
            },
          },
        },
      });

      const mockResourceWithLongRequest = {
        ...mockResource,
        getData: () => resolver(result, 5000),
      };

      actions.getResource(
        mockResourceWithLongRequest,
        mockRouterStoreContext,
        mockOptions
      );

      const Component = () => {
        const { data, loading } = useResource(mockResource);

        if (loading) {
          return <div id="loading" />;
        }

        if (data) {
          return <div id="data" />;
        }

        return null;
      };
      const wrapper = mount(<Component />);

      expect(wrapper.find('#loading')).toHaveLength(1);
      expect(wrapper.find('#data')).toHaveLength(0);
    });

    it('should select the right resource slice out of the state', () => {
      const state = {
        context: {},
        data: {
          [type]: {
            [key]: {
              data: 'foobar',
              loading: false,
              error: null,
              promise: null,
              expiresAt,
              accessedAt,
            },
            foo: {
              data: 'bazqux',
              loading: false,
              error: null,
              promise: null,
              expiresAt,
              accessedAt,
            },
          },
          bar: {
            baz: {
              data: 'qux',
              loading: false,
              error: null,
              promise: null,
              expiresAt,
              accessedAt,
            },
          },
        },
      };
      // @ts-ignore mocking resource store state
      const slice = getSliceForResource(state, { type, key });

      expect(slice).toEqual({
        data: 'foobar',
        error: null,
        loading: false,
        promise: null,
        expiresAt,
        accessedAt,
      });
    });

    it('should get the slice of data for the type and key', async () => {
      const id = 'test';

      storeState.setState({
        data: {
          [type]: {
            [key]: {
              data: { id },
              loading: false,
              error: null,
              promise: null,
              accessedAt: null,
            },
          },
        },
      });

      const Component = () => {
        const { data, loading } = useResource(mockResource);

        if (loading) {
          return <div id="loading" />;
        }

        if (data) {
          // @ts-ignore
          return <div id={data.id} />;
        }

        return null;
      };
      const wrapper = mount(<Component />);

      expect(wrapper.find('#loading')).toHaveLength(0);
      expect(wrapper.find(`#${id}`)).toHaveLength(1);
    });
  });

  describe('getResourceFromRemote', () => {
    describe('when the slice in the store is currently loading', () => {
      const mockSlice = {
        ...BASE_DEFAULT_STATE_SLICE,
        loading: true,
        expiresAt,
        accessedAt,
      };
      beforeEach(() => {
        (getDefaultStateSlice as any).mockImplementation(() => mockSlice);
      });

      it('should return the slice and not modify state', async () => {
        const spy = jest.spyOn(storeState, 'setState');

        const slice = await actions.getResourceFromRemote(
          mockResource,
          mockRouterStoreContext,
          mockOptions
        );

        expect(slice).toEqual(mockSlice);
        expect(spy).toBeCalledTimes(0);
      });
    });

    it('should set expiresAt to pending state if prefetch', async () => {
      (getDefaultStateSlice as any).mockImplementation(() => ({
        ...BASE_DEFAULT_STATE_SLICE,
      }));
      (getExpiresAt as any).mockImplementation(() => expiresAt);

      const spy = jest.spyOn(storeState, 'setState');

      await actions.getResourceFromRemote(
        mockResource,
        mockRouterStoreContext,
        { ...mockOptions, prefetch: true }
      );

      expect(spy).toHaveBeenNthCalledWith(1, {
        context: {},
        data: {
          [type]: {
            [key]: {
              ...BASE_DEFAULT_STATE_SLICE,
              loading: true,
              accessedAt: undefined,
              expiresAt,
              promise: expect.any(Promise),
            },
          },
        },
      });
    });
  });

  describe('cleanExpiredResources', () => {
    const currentTime = 100;

    const expiredResource = {
      ...mockResource,
      ...{
        type: 'expiredResource',
        getKey: () => 'expiredResourceKey',
        getData: () => resolver('hello world', 250),
      },
    };
    const cachedResource = {
      ...mockResource,
      ...{
        type: 'cachedResource',
        getKey: () => 'cachedResourceKey',
        getData: () => resolver('hello world', 250),
      },
    };

    beforeEach(() => {
      jest.spyOn(global.Date, 'now').mockReturnValue(currentTime);
      (getExpiresAt as any).mockImplementation(() => currentTime);
      (getAccessedAt as any).mockImplementation(() => currentTime);
      storeState.setState({
        data: {
          expiredResource: {
            expiredResourceKey: {
              data: result,
              loading: false,
              error: 'some error',
              promise: getDataPromise,
              expiresAt: 50,
              accessedAt: currentTime,
            },
          },
          cachedResource: {
            cachedResourceKey: {
              data: result,
              loading: false,
              error: 'some error',
              promise: getDataPromise,
              expiresAt: 200,
              accessedAt: currentTime,
            },
          },
        },
      });
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should clear the data for expired resources', () => {
      actions.cleanExpiredResources([expiredResource, cachedResource], {
        route: mockRoute,
        match: mockMatch,
        query: {},
      });

      const { data } = storeState.getState();

      expect(data).toEqual({
        expiredResource: {},
        cachedResource: {
          cachedResourceKey: {
            data: result,
            loading: false,
            error: 'some error',
            promise: getDataPromise,
            expiresAt: 200,
            accessedAt: currentTime,
          },
        },
      });
    });
  });
});
