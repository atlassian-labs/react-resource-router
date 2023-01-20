import { mount } from 'enzyme';
import React from 'react';
import { BoundActions, defaultRegistry } from 'react-sweet-state';

import { ResourceType, RouteResourceResponse } from '../../common/types';
import { isServerEnvironment } from '../../common/utils/is-server-environment';
import * as routerStoreModule from '../router-store';
import { useResource } from '../use-resource';

import { getSliceForResource } from './selectors';
import { State as ResourceStoreState } from './types';
import {
  createResource,
  getAccessedAt,
  getDefaultStateSlice,
  getExpiresAt,
  serializeError,
  shouldUseCache,
  TimeoutError,
} from './utils';
import { BASE_DEFAULT_STATE_SLICE } from './utils/get-default-state-slice/constants';

import { Actions, getResourceStore, ResourceDependencyError } from './index';

jest.mock('../../common/utils/is-server-environment');

jest.mock('./utils', () => ({
  ...jest.requireActual('./utils'),
  shouldUseCache: jest.fn(),
  getDefaultStateSlice: jest.fn(),
}));

jest.mock('./utils/accessed-at', () => ({
  getAccessedAt: jest.fn(),
}));

jest.mock('./utils/expires-at', () => ({
  ...jest.requireActual('./utils/expires-at'),
  getExpiresAt: jest.fn(),
}));

describe('resource store', () => {
  let resourceStore;
  let storeState: any;
  let actions: BoundActions<ResourceStoreState, Actions>;

  const type = 'type';
  const key = 'key';
  const result = 'result';
  const error = new Error('something failed');
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
    maxAge: Number.MAX_SAFE_INTEGER,
  });
  const resolver = (resolveWith: any, delay = 0) =>
    new Promise(resolve => setTimeout(() => resolve(resolveWith), delay));

  const getResourceSlice = (
    t: ResourceType
  ): Partial<RouteResourceResponse<unknown>> =>
    storeState.getState().data?.[t]?.key;

  const setResourceSlice = (
    t: ResourceType,
    slice: Partial<RouteResourceResponse<unknown>>
  ) =>
    Object.assign(storeState.getState().data, {
      [t]: {
        key: slice,
      },
    });

  beforeEach(() => {
    resourceStore = getResourceStore();
    storeState = resourceStore.storeState;
    actions = resourceStore.actions;
    // @ts-ignore
    window.featureFlags = {};
  });

  afterEach(() => {
    defaultRegistry.stores.clear();
    jest.resetAllMocks();
    jest.restoreAllMocks();
    // @ts-ignore
    delete window.featureFlags;
  });

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
        bar: { data: 'baz', loading: false, error: null, promise: null },
      };

      it('should return the resolved response', async () => {
        const response = await actions.getResource(
          mockResource,
          mockRouterStoreContext,
          mockOptions
        );

        expect(response).toEqual({
          data: result,
          error: null,
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
                error: null,
                promise: getDataPromise,
                expiresAt,
                accessedAt,
              },
            },
          },
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
            error: null,
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
                error: null,
                promise: getDataPromise,
                expiresAt,
                accessedAt,
              },
            },
          },
          executing: null,
          prefetching: null,
        });
        expect(spy).toHaveBeenNthCalledWith(2, {
          context: {},
          data: {
            [type]: {
              [key]: {
                data: result,
                loading: false,
                error: null,
                promise: getDataPromise,
                expiresAt,
                accessedAt,
              },
            },
          },
          executing: null,
          prefetching: null,
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
                  expiresAt,
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
          executing: null,
          prefetching: null,
        });
      });
    });
  });

  describe('actions', () => {
    beforeEach(() => {
      (getExpiresAt as any).mockReturnValue(200);
      (getAccessedAt as any).mockReturnValue(100);
      (getDefaultStateSlice as any).mockReturnValue(BASE_DEFAULT_STATE_SLICE);
    });

    describe('requestResources', () => {
      it('should skip isBrowserOnly resources on a server environment', () => {
        (isServerEnvironment as any).mockReturnValue(true);

        const data = actions.requestResources(
          [{ ...mockResource, isBrowserOnly: true }],
          mockRouterStoreContext,
          mockOptions
        );

        expect(data).toEqual([]);
      });

      it('should request isBrowserOnly resources on a client environment', async () => {
        (isServerEnvironment as any).mockReturnValue(false);
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
              data: 'result',
              error: null,
              expiresAt: 200,
              accessedAt: 100,
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
                error: null,
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
                error: null,
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
                error: null,
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
                error: null,
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
      describe('where already loading', () => {
        it('should not change state and return the previous slice', async () => {
          const getData = jest.fn();
          setResourceSlice(type, {
            loading: true,
            data: 'data1',
            error,
            promise: Promise.resolve('data1'),
            accessedAt: 0,
            expiresAt: 0,
          });
          const pending = actions.getResourceFromRemote(
            { ...mockResource, getData },
            mockRouterStoreContext,
            mockOptions
          );

          expect(getData).not.toBeCalled();
          expect(getAccessedAt).not.toBeCalled();
          expect(getExpiresAt).not.toBeCalled();
          const slice = getResourceSlice(type);
          expect(slice).toEqual(
            expect.objectContaining({
              loading: true,
              data: 'data1',
              error,
              promise: expect.any(Promise),
              accessedAt: 0,
              expiresAt: 0,
            })
          );
          await expect(slice.promise).resolves.toEqual('data1');

          const returnValue = await pending;

          expect(getAccessedAt).not.toBeCalled();
          expect(getExpiresAt).not.toBeCalled();
          expect(returnValue).toEqual(slice);
        });
      });

      describe('where getData() synchronously returns previous data', () => {
        it('should not change state but should set accessedAt and expiresAt', async () => {
          const data = {};
          const getData = jest.fn().mockReturnValue(data);
          setResourceSlice(type, {
            loading: false,
            data,
            error,
            promise: Promise.resolve(data),
            accessedAt: 0,
            expiresAt: 0,
          });
          const pending = actions.getResourceFromRemote(
            { ...mockResource, getData },
            mockRouterStoreContext,
            mockOptions
          );

          expect(getData).toBeCalled();
          const slice1 = getResourceSlice(type);
          expect(slice1).toEqual(
            expect.objectContaining({
              loading: false,
              data,
              error,
              accessedAt: 100,
              expiresAt: 200,
            })
          );

          await expect(slice1.promise).resolves.toEqual(data);
          const returnValue = await pending;

          expect(getAccessedAt).toBeCalled();
          expect(getExpiresAt).toBeCalled();
          const slice2 = getResourceSlice(type);
          expect(returnValue).toEqual(slice2);
        });
      });

      describe('where getData() synchronously returns new data', () => {
        it('should skip loading state and resolve new data immediately', async () => {
          const getData = jest.fn().mockReturnValue('data2');
          setResourceSlice(type, {
            loading: false,
            data: 'data1',
            error,
            promise: Promise.resolve('data1'),
            accessedAt: 0,
            expiresAt: 0,
          });
          actions.getResourceFromRemote(
            { ...mockResource, getData },
            mockRouterStoreContext,
            { ...mockOptions }
          );

          expect(getData).toBeCalled();

          const slice1 = getResourceSlice(type);
          expect(slice1).toEqual(
            expect.objectContaining({
              loading: false,
              data: 'data2',
              error: null,
              promise: slice1.promise,
              accessedAt: 100,
              expiresAt: 200,
            })
          );

          await expect(slice1.promise).resolves.toEqual('data2');
        });
      });

      describe('where getData() returns resolving promise', () => {
        it.each([0, 100])(
          'should enter loading state with promise resolving new data (timeout=%s)',
          async timeout => {
            const getData = jest.fn().mockReturnValue(Promise.resolve('data2'));
            setResourceSlice(type, {
              loading: false,
              data: 'data1',
              error,
              promise: Promise.resolve('data1'),
              accessedAt: 0,
              expiresAt: 0,
            });
            const pending = actions.getResourceFromRemote(
              { ...mockResource, getData },
              mockRouterStoreContext,
              { ...mockOptions, timeout }
            );

            expect(getData).toBeCalled();
            const slice1 = getResourceSlice(type);
            expect(slice1).toEqual(
              expect.objectContaining({
                loading: true,
                data: 'data1',
                error,
                promise: expect.any(Promise),
                accessedAt: 100,
                expiresAt: 200,
              })
            );

            await expect(slice1.promise).resolves.toEqual('data2');
            const returnValue = await pending;

            const slice2 = getResourceSlice(type);
            expect(returnValue).toEqual(slice2);
            expect(slice2).toEqual(
              expect.objectContaining({
                loading: false,
                data: 'data2',
                error: null,
                promise: slice1.promise,
                accessedAt: 100,
                expiresAt: 200,
              })
            );
          }
        );
      });

      describe('where getData() returns rejecting promise', () => {
        it.each([0, 100])(
          'should enter loading state with promise rejecting error and preserve existing data on loaded (timeout=%s)',
          async timeout => {
            const getData = jest.fn().mockReturnValue(Promise.reject(error));
            setResourceSlice(type, {
              loading: false,
              data: 'data1',
              error: null,
              promise: Promise.resolve('data1'),
              accessedAt: 0,
              expiresAt: 0,
            });
            const pending = actions.getResourceFromRemote(
              { ...mockResource, getData },
              mockRouterStoreContext,
              { ...mockOptions, timeout }
            );

            expect(getData).toBeCalled();
            const slice1 = getResourceSlice(type);
            expect(slice1).toEqual(
              expect.objectContaining({
                loading: true,
                data: 'data1',
                error: null,
                promise: expect.any(Promise),
                accessedAt: 100,
                expiresAt: 200,
              })
            );

            await expect(slice1.promise).rejects.toEqual(error);
            const returnValue = await pending;

            const slice2 = getResourceSlice(type);
            expect(returnValue).toEqual(slice2);
            expect(slice2).toEqual(
              expect.objectContaining({
                loading: false,
                data: 'data1',
                error,
                promise: slice1.promise,
                accessedAt: 100,
                expiresAt: 200,
              })
            );
          }
        );
      });

      describe('where getData() times out', () => {
        it('should enter loading state with promise rejecting TimeoutError and preserve existing data on loaded', async () => {
          const getData = jest
            .fn()
            .mockImplementation(() => resolver('data2', 250));
          setResourceSlice(type, {
            loading: false,
            data: 'data1',
            error: null,
            promise: Promise.resolve('data1'),
            accessedAt: 0,
            expiresAt: 0,
          });
          const pending = actions.getResourceFromRemote(
            { ...mockResource, getData },
            mockRouterStoreContext,
            { ...mockOptions, timeout: 100 }
          );

          expect(getData).toBeCalled();
          const slice1 = getResourceSlice(type);
          expect(slice1).toEqual(
            expect.objectContaining({
              loading: true,
              data: 'data1',
              error: null,
              promise: expect.any(Promise),
              accessedAt: 100,
              expiresAt: 200,
            })
          );

          await expect(slice1.promise).rejects.toEqual(
            expect.any(TimeoutError)
          );
          const returnValue = await pending;

          const slice2 = getResourceSlice(type);
          expect(returnValue).toEqual(slice2);
          expect(slice2).toEqual(
            expect.objectContaining({
              loading: true,
              data: 'data1',
              error: expect.any(TimeoutError),
              promise: null,
              accessedAt: 100,
              expiresAt: 200,
            })
          );
        });
      });
    });

    describe('prefetchResources', () => {
      it('should not affect resource state', async () => {
        const getData = jest.fn();
        const slice = getResourceSlice(type);
        const pending = actions.prefetchResources(
          [{ ...mockResource, getData }],
          mockRouterStoreContext,
          { ...mockOptions }
        );

        expect(getData).toBeCalled();
        await pending;
        expect(getResourceSlice(type)).toEqual(slice);
      });

      it('should cache deferrable, use it on actual request and then clear on success', async () => {
        jest.spyOn(Date, 'now').mockImplementation(() => expiresAt);
        const getData = jest.fn().mockReturnValueOnce('prefetch data1');
        actions.prefetchResources(
          [{ ...mockResource, getData }],
          mockRouterStoreContext,
          { ...mockOptions }
        );

        expect(storeState.getState().prefetching).toEqual({
          [type]: {
            [key]: {
              promise: expect.any(Promise),
              data: 'prefetch data1',
              expiresAt: 200,
            },
          },
        });

        const pending = actions.getResourceFromRemote(
          { ...mockResource, getData },
          mockRouterStoreContext,
          { ...mockOptions, prefetch: false }
        );

        const slice = getResourceSlice(type);
        const returnValue = await pending;

        expect(returnValue).toEqual(slice);
        expect(slice).toEqual(
          expect.objectContaining({
            loading: false,
            data: 'prefetch data1',
            error: null,
            promise: expect.any(Promise),
            accessedAt: 100,
            expiresAt: 200,
          })
        );
        expect(storeState.getState().prefetching).toEqual({
          [type]: { [key]: undefined },
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

      it('should delete the resource slice for expired resources', () => {
        actions.cleanExpiredResources(
          [expiredResource, cachedResource],
          mockRouterStoreContext
        );

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

    describe('clearResource', () => {
      it('should delete the slice of the given resource and context', () => {
        storeState.setState({
          data: {
            cachedResource: {
              cachedResourceKey: {
                data: result,
              },
            },
          },
        });

        const cachedResource = {
          ...mockResource,
          ...{
            type: 'cachedResource',
            getKey: () => 'cachedResourceKey',
          },
        };

        actions.clearResource(cachedResource, mockRouterStoreContext);

        const { data } = storeState.getState();

        expect(data).toEqual({ cachedResource: {} });
      });

      it('should delete slices for all keys associated with that particular resource if context is omitted', () => {
        storeState.setState({
          data: {
            cachedResource: {
              cachedResourceKey: {
                data: result,
              },
              cachedResourceKeyAlt: {
                data: result,
              },
            },
            cachedResourceAlt: {
              cachedResourceKey: {
                data: result,
              },
            },
          },
        });

        const cachedResource = {
          ...mockResource,
          ...{
            type: 'cachedResource',
            getKey: () => 'cachedResourceKey',
          },
        };

        actions.clearResource(cachedResource);

        const { data } = storeState.getState();

        expect(data).toEqual({
          cachedResourceAlt: {
            cachedResourceKey: {
              data: result,
            },
          },
        });
      });
    });
  });

  describe('consistency of promise and data under race conditions', () => {
    beforeEach(() => {
      (getExpiresAt as any).mockReturnValue(200);
      (getAccessedAt as any).mockReturnValue(100);
      (getDefaultStateSlice as any).mockReturnValue(BASE_DEFAULT_STATE_SLICE);
      setResourceSlice(type, {
        loading: false,
        data: 'data1',
        error,
        promise: Promise.resolve('data1'),
      });
    });

    describe('when update occurs outside loading', () => {
      it('should clear error and set promise on update', async () => {
        actions.updateResourceState(
          mockResource,
          mockRouterStoreContext,
          () => 'data2'
        );

        const slice = getResourceSlice(type);
        expect(slice).toEqual(
          expect.objectContaining({
            loading: false,
            data: 'data2',
            error: null,
            promise: expect.any(Promise),
          })
        );
        await expect(slice.promise).resolves.toEqual('data2');
      });

      it('should set promise when loading but keep data (assume not expired)', async () => {
        actions.updateResourceState(
          mockResource,
          mockRouterStoreContext,
          () => 'data2'
        );
        actions.getResourceFromRemote(
          mockResource,
          mockRouterStoreContext,
          mockOptions
        );

        const slice = getResourceSlice(type);
        expect(slice).toEqual(
          expect.objectContaining({
            loading: true,
            data: 'data2',
            error: null,
            promise: expect.any(Promise),
          })
        );
        await expect(slice.promise).resolves.toEqual('result');
      });

      it('should set new data and on loaded', async () => {
        actions.updateResourceState(
          mockResource,
          mockRouterStoreContext,
          () => 'data2'
        );
        const returnValue = await actions.getResourceFromRemote(
          mockResource,
          mockRouterStoreContext,
          mockOptions
        );

        const slice = getResourceSlice(type);
        expect(returnValue).toEqual(slice);
        expect(slice).toEqual(
          expect.objectContaining({
            loading: false,
            data: 'result',
            error: null,
            promise: expect.any(Promise),
          })
        );
        await expect(slice.promise).resolves.toEqual('result');
      });
    });

    describe('when update occurs during loading', () => {
      it('should set promise on loading but retain data and error (assume not expired)', async () => {
        actions.getResourceFromRemote(
          mockResource,
          mockRouterStoreContext,
          mockOptions
        );

        const slice = getResourceSlice(type);
        expect(slice).toEqual(
          expect.objectContaining({
            loading: true,
            data: 'data1',
            error,
            promise: expect.any(Promise),
          })
        );
        await expect(slice.promise).resolves.toEqual('result');
      });

      it('should clear error on update but retain promise', async () => {
        actions.getResourceFromRemote(
          mockResource,
          mockRouterStoreContext,
          mockOptions
        );
        actions.updateResourceState(
          mockResource,
          mockRouterStoreContext,
          () => 'data2'
        );

        const slice = getResourceSlice(type);
        expect(slice).toEqual(
          expect.objectContaining({
            loading: true,
            data: 'data2',
            error: null,
            promise: expect.any(Promise),
          })
        );
        await expect(slice.promise).resolves.toEqual('result');
      });

      it('should set new data on loaded', async () => {
        const pending = actions.getResourceFromRemote(
          mockResource,
          mockRouterStoreContext,
          mockOptions
        );
        actions.updateResourceState(
          mockResource,
          mockRouterStoreContext,
          () => 'data2'
        );
        const returnValue = await pending;

        const slice = getResourceSlice(type);
        expect(returnValue).toEqual(slice);
        expect(slice).toEqual(
          expect.objectContaining({
            loading: false,
            data: 'result',
            error: null,
            promise: expect.any(Promise),
          })
        );
        await expect(slice.promise).resolves.toEqual('result');
      });

      it('should retain updated data and set error on failed', async () => {
        const rejection = new Error('failing');
        const pending = actions.getResourceFromRemote(
          { ...mockResource, getData: () => Promise.reject(rejection) },
          mockRouterStoreContext,
          mockOptions
        );
        actions.updateResourceState(
          mockResource,
          mockRouterStoreContext,
          () => 'data2'
        );
        const returnValue = await pending;

        const slice = getResourceSlice(type);
        expect(returnValue).toEqual(slice);
        expect(slice).toEqual(
          expect.objectContaining({
            loading: false,
            data: 'data2',
            error: rejection,
          })
        );
        await expect(slice.promise).rejects.toEqual(rejection);
      });
    });

    describe('when clear occurs during loading', () => {
      it('should set promise on loading but retain data and error (assume not expired)', async () => {
        actions.getResourceFromRemote(
          mockResource,
          mockRouterStoreContext,
          mockOptions
        );

        const slice = getResourceSlice(type);
        expect(slice).toEqual(
          expect.objectContaining({
            loading: true,
            data: 'data1',
            error,
            promise: expect.any(Promise),
          })
        );
        await expect(slice.promise).resolves.toEqual('result');
      });

      it('should delete resource state on clear', async () => {
        actions.getResourceFromRemote(
          mockResource,
          mockRouterStoreContext,
          mockOptions
        );
        actions.clearResource(mockResource, mockRouterStoreContext);

        const slice = getResourceSlice(type);
        expect(slice).not.toBeDefined();
      });

      it('should not reinstate resource slice on loaded', async () => {
        const pending = actions.getResourceFromRemote(
          mockResource,
          mockRouterStoreContext,
          mockOptions
        );
        actions.clearResource(mockResource, mockRouterStoreContext);
        const returnValue = await pending;

        const slice = getResourceSlice(type);
        expect(slice).not.toBeDefined();
        expect(returnValue).toEqual(
          expect.objectContaining({
            loading: false,
            data: 'result',
            error: null,
            promise: expect.any(Promise),
          })
        );
        await expect(returnValue.promise).resolves.toEqual('result');
      });

      it('should not reinstate resource slice on failed', async () => {
        const rejection = new Error('failing');
        const pending = actions.getResourceFromRemote(
          { ...mockResource, getData: () => Promise.reject(rejection) },
          mockRouterStoreContext,
          mockOptions
        );
        actions.clearResource(mockResource, mockRouterStoreContext);
        const returnValue = await pending;

        const slice = getResourceSlice(type);
        expect(slice).not.toBeDefined();
        expect(returnValue).toEqual(
          expect.objectContaining({
            loading: false,
            data: 'data1',
            error: rejection,
          })
        );

        await expect(returnValue.promise).rejects.toEqual(rejection);
      });
    });
  });

  describe('dependent resources', () => {
    beforeEach(() => {
      (getExpiresAt as any).mockReturnValueOnce(200).mockReturnValueOnce(220);
      (getAccessedAt as any).mockReturnValue(100).mockReturnValue(110);
      (getDefaultStateSlice as any).mockReturnValue(BASE_DEFAULT_STATE_SLICE);
    });

    beforeEach(() => {
      setResourceSlice(mockResource.type, {
        loading: false,
        data: 'data1',
        error,
        promise: Promise.resolve('data1'),
        accessedAt,
        expiresAt,
      });
      setResourceSlice(mockDependentResource.type, {
        loading: false,
        data: 'data2',
        error,
        promise: Promise.resolve('data2'),
        accessedAt,
        expiresAt,
      });
    });

    const mockDependentResource = createResource({
      ...mockResource,
      type: 'dependent',
      depends: [type],
    });
    const mockRouterStoreDependentContext = {
      ...mockRouterStoreContext,
      route: {
        ...mockRoute,
        resources: [mockResource, mockDependentResource],
      },
    };
    const mockRouterStoreNoResourcesContext = {
      ...mockRouterStoreContext,
      route: {
        ...mockRoute,
        resources: [],
      },
    };

    describe('actions on an independent resource where present on on the route', () => {
      it.each([
        [
          'request',
          () =>
            actions.requestResources(
              [mockResource],
              mockRouterStoreContext,
              {}
            ),
        ] as const,
        [
          'clear',
          () => actions.clearResource(mockResource, mockRouterStoreContext),
        ] as const,
        [
          'update',
          () =>
            actions.updateResourceState(
              mockResource,
              mockRouterStoreContext,
              () => 'data2'
            ),
        ] as const,
        [
          'refresh',
          () =>
            actions.getResourceFromRemote(
              mockResource,
              mockRouterStoreContext,
              {}
            ),
        ] as const,
      ])('%s should operate outside of executing state', (_label, action) => {
        const setState = jest.spyOn(storeState, 'setState');
        expect(action).not.toThrow();
        expect(setState).not.toHaveBeenNthCalledWith(
          1,
          expect.objectContaining({
            executing: expect.any(Array),
          })
        );
      });
    });

    describe('actions on dependent resource where present on the route', () => {
      it.each([
        [
          'request',
          () =>
            actions.requestResources(
              [mockDependentResource],
              mockRouterStoreDependentContext,
              {}
            ),
        ] as const,
        [
          'clear',
          () =>
            actions.clearResource(
              mockDependentResource,
              mockRouterStoreDependentContext
            ),
        ] as const,
        [
          'update',
          () =>
            actions.updateResourceState(
              mockDependentResource,
              mockRouterStoreDependentContext,
              () => 'data2'
            ),
        ] as const,
        [
          'refresh',
          () =>
            actions.getResourceFromRemote(
              mockDependentResource,
              mockRouterStoreDependentContext,
              {}
            ),
        ] as const,
      ])('%s should operate with executing state', (_label, action) => {
        const setState = jest.spyOn(storeState, 'setState');
        expect(action).not.toThrow();
        expect(setState).toHaveBeenNthCalledWith(
          1,
          expect.objectContaining({
            executing: expect.any(Array),
          })
        );
      });

      it.each([
        [
          'request',
          () =>
            actions.requestResources(
              [mockDependentResource],
              mockRouterStoreDependentContext,
              {}
            ),
        ],
        [
          'refresh',
          () =>
            actions.getResourceFromRemote(
              mockDependentResource,
              mockRouterStoreDependentContext,
              {}
            ),
        ],
      ])(
        '%s should request dependent resource but not dependency resource',
        (_label, action) => {
          const spy1 = jest.spyOn(mockResource, 'getData');
          const spy2 = jest.spyOn(mockDependentResource, 'getData');

          expect(action).not.toThrow();

          const slice = getResourceSlice(type);
          expect(slice.loading).toBe(false);

          expect(spy1).not.toBeCalled();
          expect(spy2).toHaveBeenCalledWith(
            {
              dependencies: {
                [type]: slice,
              },
              isPrefetch: false,
              ...mockRouterStoreDependentContext,
            },
            {}
          );
        }
      );

      it('clear should not clear dependency resource', () => {
        actions.clearResource(
          mockDependentResource,
          mockRouterStoreDependentContext
        );

        expect(getResourceSlice(mockResource.type)).toBeDefined();
        expect(getResourceSlice(mockDependentResource.type)).toBeUndefined();
      });

      it('update should not request dependency resource', () => {
        const spy1 = jest.spyOn(mockResource, 'getData');
        const spy2 = jest.spyOn(mockDependentResource, 'getData');

        actions.updateResourceState(
          mockDependentResource,
          mockRouterStoreDependentContext,
          () => 'data3'
        );

        const slice = getResourceSlice(mockDependentResource.type);
        expect(slice).toEqual(
          expect.objectContaining({
            loading: false,
            data: 'data3',
          })
        );

        expect(spy1).not.toBeCalled();
        expect(spy2).not.toBeCalled();
      });
    });

    describe('actions on dependent resource where omitted from on the route', () => {
      it.each([
        [
          'request',
          () =>
            actions.requestResources(
              [mockDependentResource],
              mockRouterStoreNoResourcesContext,
              {}
            ),
        ] as const,
        [
          'clear',
          () =>
            actions.clearResource(
              mockDependentResource,
              mockRouterStoreContext
            ),
        ] as const,
        [
          'update',
          () =>
            actions.updateResourceState(
              mockDependentResource,
              mockRouterStoreNoResourcesContext,
              () => 'data2'
            ),
        ] as const,
        [
          'refresh',
          () =>
            actions.getResourceFromRemote(
              mockDependentResource,
              mockRouterStoreNoResourcesContext,
              {}
            ),
        ] as const,
      ])('%s should operate outside of executing state', (_label, action) => {
        const setState = jest.spyOn(storeState, 'setState');
        expect(action).not.toThrow();
        expect(setState).not.toHaveBeenNthCalledWith(
          1,
          expect.objectContaining({
            executing: expect.any(Array),
          })
        );
      });

      it.each([
        [
          'request',
          () =>
            actions.requestResources(
              [mockDependentResource],
              mockRouterStoreNoResourcesContext,
              {}
            ),
        ] as const,
        [
          'refresh',
          () =>
            actions.getResourceFromRemote(
              mockDependentResource,
              mockRouterStoreNoResourcesContext,
              {}
            ),
        ] as const,
      ])(
        '%s should fail with ResourceDependencyError',
        async (_label, action) => {
          setResourceSlice(mockDependentResource.type, {
            loading: false,
            data: 'data1',
            error: null,
            promise: Promise.resolve('data1'),
            accessedAt: 0,
            expiresAt: 0,
          });

          const pending = action();
          const [firstValue] = await Promise.all(
            Array.isArray(pending) ? pending : [pending]
          );

          const slice = getResourceSlice(mockDependentResource.type);
          expect(firstValue).toEqual(slice);
          expect(slice).toEqual(
            expect.objectContaining({
              loading: false,
              data: 'data1',
              error: expect.any(ResourceDependencyError),
            })
          );
          await expect(slice.promise).rejects.toEqual(
            expect.any(ResourceDependencyError)
          );
        }
      );
    });

    describe('actions on depended resource where there is dependent resource on the route', () => {
      const mockRequestAction = () =>
        actions.requestResources(
          [mockResource],
          mockRouterStoreDependentContext,
          {}
        );
      const mockRefreshAction = () =>
        actions.getResourceFromRemote(
          mockResource,
          mockRouterStoreDependentContext,
          {}
        );

      it.each([
        ['request', mockRequestAction] as const,
        [
          'clear',
          () =>
            actions.clearResource(
              mockResource,
              mockRouterStoreDependentContext
            ),
        ] as const,
        [
          'update',
          () =>
            actions.updateResourceState(
              mockResource,
              mockRouterStoreDependentContext,
              () => 'data2'
            ),
        ] as const,
        ['refresh', mockRefreshAction] as const,
      ])('%s should operate with executing state', (_label, action) => {
        const setState = jest.spyOn(storeState, 'setState');
        expect(action).not.toThrow();
        expect(setState).toHaveBeenNthCalledWith(
          1,
          expect.objectContaining({
            executing: expect.any(Array),
          })
        );
        expect(setState).toHaveBeenLastCalledWith(
          expect.objectContaining({
            executing: null,
            prefetching: null,
          })
        );
      });

      it.each([
        ['request', mockRequestAction],
        ['refresh', mockRefreshAction],
      ])(
        '%s returning promise should request dependent resource with dependency loading',
        (_label, action) => {
          const spy1 = jest
            .spyOn(mockResource, 'getData')
            .mockReturnValue(Promise.resolve('data1'));
          const spy2 = jest.spyOn(mockDependentResource, 'getData');

          expect(action).not.toThrow();

          const slice = getResourceSlice(type);
          expect(slice.loading).toBe(true);

          expect(spy1).toHaveBeenCalledWith(
            {
              dependencies: {},
              isPrefetch: false,
              ...mockRouterStoreDependentContext,
            },
            {}
          );
          expect(spy2).toHaveBeenCalledWith(
            {
              dependencies: {
                [type]: slice,
              },
              isPrefetch: false,
              ...mockRouterStoreDependentContext,
            },
            {}
          );
        }
      );

      it.each([
        ['request', mockRequestAction],
        ['refresh', mockRefreshAction],
      ])(
        '%s returning new value should request dependent resource with dependency not loading',
        (_label, action) => {
          const spy1 = jest
            .spyOn(mockResource, 'getData')
            .mockReturnValue('data2');
          const spy2 = jest.spyOn(mockDependentResource, 'getData');

          expect(action).not.toThrow();

          const slice = getResourceSlice(type);
          expect(slice.loading).toBe(false); // sync data = no loading state

          expect(spy1).toHaveBeenCalledWith(
            {
              dependencies: {},
              isPrefetch: false,
              ...mockRouterStoreDependentContext,
            },
            {}
          );
          expect(spy2).toHaveBeenCalledWith(
            {
              dependencies: {
                [type]: slice,
              },
              isPrefetch: false,
              ...mockRouterStoreDependentContext,
            },
            {}
          );
        }
      );

      it.each([
        ['request', mockRequestAction],
        ['refresh', mockRefreshAction],
      ])(
        '%s returning prev value should not request dependent resource',
        (_label, action) => {
          const spy1 = jest
            .spyOn(mockResource, 'getData')
            .mockReturnValue('data1');
          const spy2 = jest.spyOn(mockDependentResource, 'getData');

          expect(action).not.toThrow();

          const slice = getResourceSlice(type);
          expect(slice.loading).toBe(false);

          expect(spy1).toHaveBeenCalledWith(
            {
              dependencies: {},
              isPrefetch: false,
              ...mockRouterStoreDependentContext,
            },
            {}
          );
          expect(spy2).not.toHaveBeenCalled();
        }
      );

      it('clear should clear dependent resource', () => {
        const spy1 = jest.spyOn(mockResource, 'getData');
        const spy2 = jest.spyOn(mockDependentResource, 'getData');

        actions.clearResource(mockResource, mockRouterStoreDependentContext);

        expect(getResourceSlice(mockResource.type)).toBeUndefined();
        expect(getResourceSlice(mockDependentResource.type)).toBeUndefined();
        expect(spy1).not.toBeCalled();
        expect(spy2).not.toBeCalled();
      });

      it('update new value should request dependent resource with dependency not loading', () => {
        const spy1 = jest.spyOn(mockResource, 'getData');
        const spy2 = jest.spyOn(mockDependentResource, 'getData');

        actions.updateResourceState(
          mockResource,
          mockRouterStoreDependentContext,
          () => 'data3'
        );

        const slice = getResourceSlice(mockResource.type);
        expect(slice).toEqual(
          expect.objectContaining({
            loading: false,
            data: 'data3',
          })
        );

        expect(spy1).not.toBeCalled();
        expect(spy2).toHaveBeenCalledWith(
          {
            dependencies: {
              [type]: slice,
            },
            isPrefetch: false,
            ...mockRouterStoreDependentContext,
          },
          {}
        );
      });

      it('update prev value should request dependent resource with dependency not loading', () => {
        const spy1 = jest.spyOn(mockResource, 'getData');
        const spy2 = jest.spyOn(mockDependentResource, 'getData');

        actions.updateResourceState(
          mockResource,
          mockRouterStoreDependentContext,
          () => 'data1'
        );

        const slice = getResourceSlice(mockResource.type);
        expect(slice).toEqual(
          expect.objectContaining({
            loading: false,
            data: 'data1',
          })
        );

        expect(spy1).not.toBeCalled();
        expect(spy2).not.toBeCalled();
      });
    });

    it('prefetching new value should request dependent resource with dependency loading', async () => {
      const spy1 = jest.spyOn(mockResource, 'getData');
      const spy2 = jest.spyOn(mockDependentResource, 'getData');

      await actions.requestResources(
        [mockResource],
        mockRouterStoreDependentContext,
        { prefetch: true }
      );

      expect(spy1).toBeCalled();
      expect(spy2).toHaveBeenCalledWith(
        {
          dependencies: {
            [type]: {
              data: 'data1',
              error,
              loading: true,
              promise: expect.any(Promise),
              accessedAt: expect.any(Number),
              expiresAt: expect.any(Number),
            },
          },
          isPrefetch: true,
          ...mockRouterStoreDependentContext,
        },
        {}
      );
    });
  });
});
