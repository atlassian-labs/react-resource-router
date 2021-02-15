import React from 'react';

import { mount } from 'enzyme';
import * as historyHelper from 'history';
import { defaultRegistry } from 'react-sweet-state';

import { Router, RouterActions, StaticRouter } from '../../controllers';
import { RouteComponent } from '../../ui';
import { RouterActionsType } from '../../controllers/router-store/types';

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
