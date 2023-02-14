import { combine } from './index';

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

describe('Combine', () => {
  it('calls each plugin method', () => {
    const pluginOne = {
      onHydrate: jest.fn(),
      onBeforeRouteLoad: jest.fn(),
      onRouteLoad: jest.fn(),
      onRoutePrefetch: jest.fn(),
    };
    const pluginTwo = {
      onHydrate: jest.fn(),
      onBeforeRouteLoad: jest.fn(),
      onRouteLoad: jest.fn(),
    };

    const pluginThree = {
      onBeforeRouteLoad: jest.fn(),
      onRouteLoad: jest.fn(),
    };

    const combinedPlugins = combine([pluginOne, pluginTwo, pluginThree]);
    combinedPlugins.onHydrate();
    combinedPlugins.onBeforeRouteLoad({
      context: firstContextMock,
      nextContext: secondContextMock,
    });
    combinedPlugins.onRouteLoad({
      context: secondContextMock,
      prevContext: firstContextMock,
    });
    combinedPlugins.onRoutePrefetch(secondContextMock);

    expect(pluginOne.onHydrate).toBeCalled();
    expect(pluginOne.onBeforeRouteLoad).toBeCalled();
    expect(pluginOne.onRouteLoad).toBeCalled();
    expect(pluginOne.onRoutePrefetch).toBeCalled();

    expect(pluginTwo.onHydrate).toBeCalled();
    expect(pluginTwo.onBeforeRouteLoad).toBeCalled();
    expect(pluginTwo.onRouteLoad).toBeCalled();

    expect(pluginThree.onBeforeRouteLoad).toBeCalled();
    expect(pluginThree.onRouteLoad).toBeCalled();
  });
});
