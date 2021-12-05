import React from 'react';

import { mount } from 'enzyme';
import * as historyHelper from 'history';
import { defaultRegistry } from 'react-sweet-state';

import { Router, RouterActions, StaticRouter } from '../../controllers';
import { RouteComponent } from '../../ui';
import { RouterActionsType } from '../../controllers/router-store/types';
import { mockRoute } from '../../common/mocks';
import { ResourceStore } from '../../controllers/resource-store';

const mockLocation = {
  pathname: '/projects/123/board/456',
  search: '?foo=hello&bar=world',
  hash: '#hash',
};

const mockRoutes = [
  {
    path: '/projects/:projectId/board/:boardId',
    component: () => null,
    name: '',
  },
  {
    path: '/anotherpath',
    component: () => null,
    name: '',
  },
];

const resolver = (resolveWith: any, delay = 0) =>
  new Promise(resolve => setTimeout(() => resolve(resolveWith), delay));

const mockResource = {
  type: 'type',
  getKey: () => 'entry',
  getData: () => Promise.resolve('mock-data'),
  maxAge: 0,
  maxCache: Infinity,
  isBrowserOnly: false,
};

const historyBuildOptions = {
  initialEntries: [
    `${mockLocation.pathname}${mockLocation.search}${mockLocation.hash}`,
  ],
};

let history = historyHelper.createMemoryHistory(historyBuildOptions);
let historyPushSpy = jest.spyOn(history, 'push');
let historyReplaceSpy = jest.spyOn(history, 'replace');
const nextTick = () => new Promise(resolve => setTimeout(resolve));

describe('<Router /> integration tests', () => {
  beforeEach(() => {
    history = historyHelper.createMemoryHistory(historyBuildOptions);
    historyPushSpy = jest.spyOn(history, 'push');
    historyReplaceSpy = jest.spyOn(history, 'replace');
  });

  afterEach(() => {
    defaultRegistry.stores.clear();
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  it('should send the right path to history API', async () => {
    let _routerActions = {} as RouterActionsType;
    mount(
      <Router routes={mockRoutes} history={history}>
        <RouterActions>
          {routerActions => {
            _routerActions = routerActions;

            return null;
          }}
        </RouterActions>
      </Router>
    );

    _routerActions.push('/hello');
    await nextTick();
    expect(historyPushSpy).toBeCalledWith(`/hello`);

    _routerActions.replace('/world');
    await nextTick();
    expect(historyReplaceSpy).toBeCalledWith(`/world`);
  });

  it('should send the right path to history API when basePath is set', async () => {
    let _routerActions = {} as RouterActionsType;
    mount(
      <Router routes={mockRoutes} history={history} basePath="/base">
        <RouterActions>
          {routerActions => {
            _routerActions = routerActions;

            return null;
          }}
        </RouterActions>
      </Router>
    );

    _routerActions.push('/hello');
    await nextTick();
    expect(historyPushSpy).toBeCalledWith(`/base/hello`);

    _routerActions.replace('/world');
    await nextTick();
    expect(historyReplaceSpy).toBeCalledWith(`/base/world`);
  });

  it('should re-trigger requests for timed out resources when mounted', async () => {
    const completedResource = {
      ...mockResource,
      ...{ type: 'HI', getData: () => resolver('hello world', 250) },
    };
    const getCompletedDataSpy = jest.spyOn(completedResource, 'getData');

    const timeoutResource = {
      ...mockResource,
      ...{
        type: 'BYE',
        getData: () => resolver('goodbye cruel world', 500),
      },
    };
    const getTimeoutDataSpy = jest.spyOn(timeoutResource, 'getData');

    const mockedRoutes = [
      {
        ...mockRoute,
        name: 'mock-route',
        path: mockLocation.pathname,
        component: () => <div>foo</div>,
        resources: [completedResource, timeoutResource],
      },
    ];

    const serverData = await StaticRouter.requestResources({
      // @ts-ignore
      routes: mockedRoutes,
      location: mockLocation.pathname,
      timeout: 350,
    });

    expect(getCompletedDataSpy).toHaveBeenCalledTimes(1);
    expect(getTimeoutDataSpy).toHaveBeenCalledTimes(1);

    expect(serverData).toEqual({
      BYE: {
        entry: {
          data: null,
          error: {
            message: 'Resource timed out: BYE',
            name: 'TimeoutError',
            stack: expect.any(String),
          },
          expiresAt: null,
          key: undefined,
          loading: true,
          promise: null,
          accessedAt: null,
        },
      },
      HI: {
        entry: {
          data: 'hello world',
          error: null,
          expiresAt: null,
          key: undefined,
          loading: false,
          promise: null,
          accessedAt: null,
        },
      },
    });

    defaultRegistry.stores.clear();

    jest.useFakeTimers();
    mount(
      <Router routes={mockedRoutes} history={history} resourceData={serverData}>
        <RouterActions>
          {() => {
            return null;
          }}
        </RouterActions>
      </Router>
    );
    jest.runAllTimers();

    // Await a fake promise to let route resources to complete
    await Promise.resolve();

    expect(getCompletedDataSpy).toHaveBeenCalledTimes(1);
    expect(getTimeoutDataSpy).toHaveBeenCalledTimes(2);

    const resourceStore = defaultRegistry.getStore(ResourceStore);

    expect(resourceStore.storeState.getState()).toEqual({
      context: {},
      data: {
        BYE: {
          entry: {
            data: 'goodbye cruel world',
            error: null,
            expiresAt: expect.any(Number),
            key: undefined,
            loading: false,
            promise: expect.any(Promise),
            accessedAt: expect.any(Number),
          },
        },
        HI: {
          entry: {
            data: 'hello world',
            error: null,
            expiresAt: expect.any(Number),
            key: undefined,
            loading: false,
            promise: expect.any(Promise),
            accessedAt: expect.any(Number),
          },
        },
      },
    });
  });
});

describe('<StaticRouter /> integration tests', () => {
  const basePath = '/base';
  const route = {
    path: '/anotherpath',
    component: () => <>important</>,
    name: '',
  };

  it('should match the right route when basePath is set', async () => {
    const wrapper = mount(
      <StaticRouter
        routes={[route]}
        location={`${basePath}${route.path}`}
        basePath={basePath}
      >
        <RouteComponent />
      </StaticRouter>
    );

    expect(wrapper.text()).toBe('important');
  });

  it('should match the right route when basePath is not set', async () => {
    const wrapper = mount(
      <StaticRouter routes={[route]} location={route.path}>
        <RouteComponent />
      </StaticRouter>
    );

    expect(wrapper.text()).toBe('important');
  });
});
