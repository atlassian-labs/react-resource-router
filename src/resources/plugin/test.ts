import { getResourceStore } from '../../controllers/resource-store';

import { createResourcesPlugin } from './index';

const firstContextMock = {
  match: {
    isExact: true,
    params: {},
    path: '/pages',
    query: {},
    url: '/pages',
  },
  query: { key: 'value' },
  route: {
    component: () => null,
    exact: true,
    name: 'pages',
    path: '/pages',
  },
};

const secondContextMock = {
  match: {
    isExact: true,
    params: { id: '1' },
    path: '/pages/:id',
    query: {},
    url: '/pages/1',
  },
  query: {},
  route: {
    component: () => null,
    name: 'page',
    path: '/pages/:id',
  },
};

describe('Resources plugin', () => {
  it('hydrates resources store with data', () => {
    const hydrate = jest.spyOn(getResourceStore().actions, 'hydrate');
    const plugin = createResourcesPlugin({
      context: {
        a: 1,
        b: 2,
      },
      resourceData: { data: 'abc' },
    });

    if (plugin.hydrate !== undefined)
      plugin.hydrate({ context: firstContextMock });

    expect(hydrate).toBeCalledWith({
      resourceContext: { a: 1, b: 2 },
      resourceData: { data: 'abc' },
    });
  });

  it('cleans up expired resources before route change', () => {
    const cleanExpiredResources = jest.spyOn(
      getResourceStore().actions,
      'cleanExpiredResources'
    );
    const plugin = createResourcesPlugin({
      context: {},
      resourceData: {},
    });

    if (plugin.beforeRouteLoad !== undefined)
      plugin.beforeRouteLoad({
        context: firstContextMock,
        nextContext: secondContextMock,
      });

    expect(cleanExpiredResources).toBeCalledWith([], secondContextMock);
  });

  it('resources are requested after router init', () => {
    const requestAllResources = jest.spyOn(
      getResourceStore().actions,
      'requestAllResources'
    );
    const plugin = createResourcesPlugin({
      context: {},
      resourceData: {},
      timeout: 1000,
    });

    if (plugin.routeLoad !== undefined)
      plugin.routeLoad({
        context: secondContextMock,
      });

    expect(requestAllResources).toBeCalledWith(secondContextMock, {
      timeout: 1000,
    });
  });

  it('resources are requested after route change', () => {
    const requestResources = jest.spyOn(
      getResourceStore().actions,
      'requestResources'
    );
    const plugin = createResourcesPlugin({
      context: {},
      resourceData: {},
      timeout: 1000,
    });

    if (plugin.routeLoad !== undefined)
      plugin.routeLoad({
        context: secondContextMock,
        prevContext: firstContextMock,
      });

    expect(requestResources).toBeCalledWith([], secondContextMock, {});
  });

  it('resources are prefetched', () => {
    const prefetchResources = jest.spyOn(
      getResourceStore().actions,
      'prefetchResources'
    );
    const plugin = createResourcesPlugin({
      context: {},
      resourceData: {},
    });

    if (plugin.routePrefetch !== undefined)
      plugin.routePrefetch({
        context: firstContextMock,
        nextContext: secondContextMock,
      });

    expect(prefetchResources).toBeCalledWith([], firstContextMock, {});
  });
});
