import React from 'react';

import { mount, render } from 'enzyme';
import * as historyHelper from 'history';
import { defaultRegistry } from 'react-sweet-state';
import { act } from 'react-dom/test-utils';

import { DEFAULT_ACTION } from '../../../../common/constants';
import { mockRoute } from '../../../../common/mocks';
import { MemoryRouter } from '../../../../controllers/memory-router';
import { getResourceStore } from '../../../../controllers/resource-store';
import { createResource } from '../../../../controllers/resource-utils';
import {
  getRouterState,
  getRouterStore,
  INITIAL_STATE,
  RouterSubscriber,
} from '../../../../controllers/router-store';
import { ResourceSubscriber } from '../../../../controllers/subscribers/resource';

const mockLocation = {
  pathname: '/pathname',
  search: '?foo=bar',
  hash: '#hash',
};

const mockHistory = {
  push: jest.fn(),
  replace: jest.fn(),
  goBack: jest.fn(),
  goForward: jest.fn(),
  registerBlock: jest.fn(),
  listen: jest.fn(),
  createHref: jest.fn(),
  location: mockLocation,
  block: jest.fn(),
};

const mockRoutes = [
  {
    path: '/pathname',
    component: () => <div>path</div>,
    name: '',
  },
  {
    path: '/blah',
    component: () => <div>path</div>,
    name: '',
  },
];

const nextTick = () => new Promise(resolve => setTimeout(resolve));

describe('SPA Router store', () => {
  const { location } = window;

  beforeAll(() => {
    delete window.location;
    // @ts-ignore
    window.location = {};
    Object.defineProperties(window.location, {
      href: { value: location.href },
      assign: { value: jest.fn() },
      replace: { value: jest.fn() },
    });
  });

  afterEach(() => {
    defaultRegistry.stores.clear();
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  afterAll(() => {
    window.location = location;
  });

  describe('initialising the store', () => {
    beforeEach(() => {
      jest
        .spyOn(historyHelper, 'createMemoryHistory')
        // @ts-ignore
        .mockImplementation(() => mockHistory);
    });

    it('should call the history listener when initialised', () => {
      mount(
        <MemoryRouter routes={[]}>
          <RouterSubscriber>
            {() => <div>I am a subscriber</div>}
          </RouterSubscriber>
        </MemoryRouter>
      );

      expect(mockHistory.listen).toBeCalled();
    });

    it('should send right props after render with routes', () => {
      mount(
        <MemoryRouter routes={[mockRoutes[0]]}>
          <RouterSubscriber>
            {({
              history,
              location: currentLocation,
              routes,
              route,
              match,
              query,
            }) => {
              expect(history).toEqual(mockHistory);
              expect(currentLocation).toEqual(mockLocation);
              expect(routes).toEqual(routes);
              expect(route).toEqual(
                expect.objectContaining({
                  path: `/pathname`,
                })
              );
              expect(match).toBeTruthy();
              expect(query).toEqual({
                foo: 'bar',
              });

              return <div>I am a subscriber</div>;
            }}
          </RouterSubscriber>
        </MemoryRouter>
      );
    });

    it('should use default store values if no overrides are provided', () => {
      expect.assertions(1);

      render(
        <RouterSubscriber>
          {renderProps => {
            expect(renderProps).toEqual(
              expect.objectContaining({
                ...INITIAL_STATE,
                history: expect.objectContaining({
                  push: expect.any(Function),
                  replace: expect.any(Function),
                  goBack: expect.any(Function),
                  goForward: expect.any(Function),
                  listen: expect.any(Function),
                  block: expect.any(Function),
                  createHref: expect.any(Function),
                }),
              })
            );

            return <div>I am a lonely subscriber</div>;
          }}
        </RouterSubscriber>
      );
    });
  });

  describe('listening for real history changes', () => {
    let children: any;

    beforeEach(() => {
      children = jest.fn().mockReturnValue(null);
    });

    it('should send location with route change', async () => {
      mount(
        <MemoryRouter routes={mockRoutes} location={mockRoutes[0].path}>
          <RouterSubscriber>{children}</RouterSubscriber>
        </MemoryRouter>
      );
      const { history } = children.mock.calls[0][0];

      await nextTick();

      expect(children.mock.calls[0]).toEqual([
        expect.objectContaining({
          routes: mockRoutes,
          route: mockRoutes[0],
          action: DEFAULT_ACTION,
          history: expect.any(Object),
        }),
        expect.any(Object),
      ]);

      const newLocation = {
        pathname: '/blah',
        search: '?somequery=value',
        hash: '#bing',
      };

      history.push(Object.values(newLocation).join(''));

      await nextTick();

      expect(children.mock.calls[1]).toEqual([
        expect.objectContaining({
          routes: mockRoutes,
          route: mockRoutes[1],
          action: 'PUSH',
          history: expect.any(Object),
        }),
        expect.any(Object),
      ]);
    });

    it('should send correct action key for route changes', async () => {
      mount(
        <MemoryRouter routes={mockRoutes}>
          <RouterSubscriber>{children}</RouterSubscriber>
        </MemoryRouter>
      );
      const { history } = children.mock.calls[0][0];

      expect(children.mock.calls[0]).toEqual([
        expect.objectContaining({
          action: DEFAULT_ACTION,
        }),
        expect.any(Object),
      ]);

      history.push('/pathname');

      await nextTick();

      expect(children.mock.calls[1]).toEqual([
        expect.objectContaining({
          action: 'PUSH',
        }),
        expect.any(Object),
      ]);

      history.replace('/blah');

      await nextTick();

      expect(children.mock.calls[2]).toEqual([
        expect.objectContaining({
          action: 'REPLACE',
        }),
        expect.any(Object),
      ]);
    });
  });

  describe('store actions', () => {
    const currentLocation = 'http://localhost/';

    beforeEach(() => {
      jest
        .spyOn(historyHelper, 'createMemoryHistory')
        // @ts-ignore
        .mockImplementation(() => mockHistory);
    });

    describe('push', () => {
      let children: any;

      beforeEach(() => {
        children = jest.fn().mockReturnValue(null);
      });

      it('should push a relative path if the URL is absolute but on the same domain', () => {
        mount(
          <MemoryRouter routes={[]}>
            <RouterSubscriber>{children}</RouterSubscriber>
          </MemoryRouter>
        );
        const path = 'http://localhost:3000/board/123';
        const { actions } = getRouterStore();

        actions.push(path);

        // expect(window.location.href).toEqual(currentLocation);
        expect(mockHistory.push).toBeCalledWith('/board/123');
      });

      it('should call window.location.assign with the absolute URL if it is on a different domain', () => {
        jest
          .spyOn(window.location, 'assign')
          .mockImplementation(() => jest.fn());

        mount(
          <MemoryRouter routes={[]}>
            <RouterSubscriber>{children}</RouterSubscriber>
          </MemoryRouter>
        );

        const path = 'http://example.com';
        const { actions } = getRouterStore();

        actions.push(path);

        expect(window.location.href).toEqual(currentLocation);
        expect(window.location.assign).toBeCalledWith(path);
      });
    });

    describe('replace', () => {
      let children: any;

      beforeEach(() => {
        children = jest.fn().mockReturnValue(null);
      });

      it('should replace a relative path if the URL is absolute but on the same domain', () => {
        mount(
          <MemoryRouter routes={[]}>
            <RouterSubscriber>{children}</RouterSubscriber>
          </MemoryRouter>
        );
        const path = 'http://localhost:3000/board/123';
        const { actions } = getRouterStore();

        actions.replace(path);

        expect(window.location.href).toEqual(currentLocation);
        expect(mockHistory.replace).toBeCalledWith('/board/123');
      });

      it('should call window.location.replace with the absolute URL if it is on a different domain', () => {
        jest
          .spyOn(window.location, 'replace')
          .mockImplementation(() => jest.fn());

        mount(
          <MemoryRouter routes={[]}>
            <RouterSubscriber>{children}</RouterSubscriber>
          </MemoryRouter>
        );

        const path = 'http://example.com';
        const { actions } = getRouterStore();

        actions.replace(path);

        expect(window.location.href).toEqual(currentLocation);
        expect(window.location.replace).toBeCalledWith(path);
      });
    });
  });

  describe('resource store interop', () => {
    const containerProps = {
      isStatic: false,
      history: mockHistory,
      routes: [],
      resourceContext: {},
      resourceData: {},
    };

    let children: any;

    beforeEach(() => {
      jest.clearAllMocks();
      children = jest.fn().mockReturnValue(null);
    });

    it('should hydrate the resource store state when bootstrapped', () => {
      const resourceContext = { foo: 'bar' };
      const resourceData = {};
      const initialResourceStoreState = {
        resourceContext,
        resourceData,
      };
      const props = { ...containerProps, ...initialResourceStoreState };
      const spy = jest.spyOn(getResourceStore().actions, 'hydrate');

      // @ts-ignore - mocks
      getRouterStore().actions.bootstrapStore(props);

      expect(spy).toBeCalledWith({
        resourceContext,
        resourceData,
      });
    });

    it('should request route resources when the router is mounted', () => {
      const spy = jest.spyOn(getResourceStore().actions, 'requestAllResources');

      mount(
        <MemoryRouter routes={mockRoutes}>
          <RouterSubscriber>{children}</RouterSubscriber>
        </MemoryRouter>
      );

      const { route, match, query } = getRouterState();

      expect(spy).toBeCalledTimes(1);
      expect(spy).toBeCalledWith({
        route,
        match,
        query,
      });
    });
  });

  describe('history listen resource store interop', () => {
    const getResourceStoreStateData = () =>
      getResourceStore().storeState.getState().data;
    const componentRenderSpy = jest.fn();

    let componentRenderStates: string[] = [];

    beforeEach(() => {
      componentRenderSpy.mockImplementation(arg =>
        componentRenderStates.push(arg)
      );
    });

    afterEach(() => {
      defaultRegistry.stores.clear();
      componentRenderStates = [];
    });

    const mountAppSetInitialLocationAndGetHistoryPush = async (
      routes: any[],
      initialLocation: string
    ): Promise<any> => {
      let historyPush = (path: string) => path;

      mount(
        <MemoryRouter routes={routes} location={initialLocation}>
          <RouterSubscriber>
            {(
              { route, location: currentLocation, query, match, action },
              { push }
            ) => {
              historyPush = push;

              return !route ? null : (
                <route.component
                  route={route}
                  location={currentLocation}
                  query={query}
                  match={match}
                  action={action}
                />
              );
            }}
          </RouterSubscriber>
        </MemoryRouter>
      );

      await nextTick();

      return historyPush;
    };

    const resourceA = createResource({
      type: 'TYPE_A',
      getKey: () => 'KEY_A',
      getData: () => Promise.resolve(`A-${Date.now()}`),
      maxAge: 0,
    });
    const resourceB = createResource({
      type: 'TYPE_B',
      getKey: () => 'KEY_B',
      getData: () => Promise.resolve(`B-${Date.now()}`),
      maxAge: Infinity,
    });

    it('should transition between routes and not render components with stale data', async () => {
      const ComponentA = () => (
        <ResourceSubscriber resource={resourceA}>
          {({ data, loading }) => {
            if (loading) {
              return <div>{componentRenderSpy(`loading:A`)}</div>;
            }

            return <div>{componentRenderSpy(`data:${String(data)}`)}</div>;
          }}
        </ResourceSubscriber>
      );

      const ComponentB = () => (
        <ResourceSubscriber resource={resourceB}>
          {({ data, loading }) => {
            if (loading) {
              return <div>{loading}</div>;
            }

            return <div>{data}</div>;
          }}
        </ResourceSubscriber>
      );

      const routes = [
        {
          ...mockRoute,
          path: '/foo/a',
          component: ComponentA,
          resources: [resourceA],
        },
        {
          ...mockRoute,
          path: '/foo/b',
          component: ComponentB,
          resources: [resourceB],
        },
      ];

      jest.spyOn(global.Date, 'now').mockReturnValue(100);

      // We start at route fooA
      const historyPush = await mountAppSetInitialLocationAndGetHistoryPush(
        routes,
        routes[0].path
      );

      const { data: dataA1 } = getResourceStoreStateData().TYPE_A.KEY_A;

      jest.spyOn(global.Date, 'now').mockReturnValue(150);

      // We go to route fooB
      historyPush(routes[1].path);

      await nextTick();
      jest.spyOn(global.Date, 'now').mockReturnValue(200);

      // We go back to fooA
      historyPush(routes[0].path);

      await nextTick();

      const { data: dataA2 } = getResourceStoreStateData().TYPE_A.KEY_A;

      expect(dataA1 === dataA2).toBeFalsy();
      expect(componentRenderStates).toEqual([
        'loading:A',
        `data:${dataA1}`,
        'loading:A',
        `data:${dataA2}`,
      ]);
    });

    it('should always get new data when doing full route changes and resources have expired', async () => {
      const ComponentA = () => (
        <ResourceSubscriber resource={resourceA}>
          {({ data, loading }) => {
            if (loading) {
              return <div>{componentRenderSpy(`loading:A`)}</div>;
            }

            let message = '';

            if (data === null) {
              message = 'isNullAndCleanedByTransitionOutOfA';
            } else {
              message = String(data);
            }

            return <div>{componentRenderSpy(`data:${message}`)}</div>;
          }}
        </ResourceSubscriber>
      );
      const ComponentB = () => (
        <ResourceSubscriber resource={resourceA}>
          {({ data, loading }) => {
            if (loading) {
              return <div>{componentRenderSpy(`loading:B`)}</div>;
            }

            let message = '';

            if (data === null) {
              message = 'isNullAndCleanedByTransitionIntoB';
            } else {
              message = String(data);
            }

            return <div>{componentRenderSpy(`data:${message}`)}</div>;
          }}
        </ResourceSubscriber>
      );
      const routes = [
        {
          ...mockRoute,
          path: '/foo/a',
          component: ComponentA,
          resources: [resourceA, resourceB],
        },
        {
          ...mockRoute,
          path: '/bar/a',
          component: ComponentB,
          resources: [resourceA, resourceB],
        },
      ];

      jest.spyOn(global.Date, 'now').mockReturnValue(100);

      // We start at route fooA
      const historyPush = await mountAppSetInitialLocationAndGetHistoryPush(
        routes,
        routes[0].path
      );
      const { data: dataA1 } = getResourceStoreStateData().TYPE_A.KEY_A;

      jest.spyOn(global.Date, 'now').mockReturnValue(150);

      // We go to routeB
      act(() => historyPush(routes[1].path));

      await nextTick();

      const { data: dataA2 } = getResourceStoreStateData().TYPE_A.KEY_A;

      expect(dataA1 === dataA2).toBeFalsy();
      expect(componentRenderStates).toEqual([
        'loading:A',
        `data:${dataA1}`,
        'loading:B',
        `data:${dataA2}`,
      ]);
    });

    it('should not clean resources when transitioning to the same route and keys have not changed', async () => {
      const ComponentA = () => (
        <ResourceSubscriber resource={resourceA}>
          {({ data, loading }) => {
            if (loading) {
              return <div>{componentRenderSpy(`loading:A`)}</div>;
            }

            let message = '';

            if (data === null) {
              message = 'isNullAndCleanedByTransitionIntoB';
            } else {
              message = String(data);
            }

            return <div>{componentRenderSpy(`data:${message}`)}</div>;
          }}
        </ResourceSubscriber>
      );
      const routes = [
        {
          ...mockRoute,
          path: '/foo/a',
          component: ComponentA,
          resources: [resourceA],
        },
      ];

      jest.spyOn(global.Date, 'now').mockReturnValue(100);

      // We start at route fooA
      const historyPush = await mountAppSetInitialLocationAndGetHistoryPush(
        routes,
        routes[0].path
      );

      const { data: dataA1 } = getResourceStoreStateData().TYPE_A.KEY_A;

      jest.spyOn(global.Date, 'now').mockReturnValue(150);

      historyPush(`${routes[0].path}?blah`);

      await nextTick();

      // This means the resource was never cleaned
      expect(
        componentRenderStates.includes('data:isNullAndCleanedByTransitionIntoB')
      ).toBeFalsy();
      expect(componentRenderStates).toEqual([
        'loading:A',
        `data:${dataA1}`,
        `data:${dataA1}`,
      ]);
    });

    it('should not refresh cached resources when transitioning on the same route', async () => {
      const ComponentB = () => (
        <ResourceSubscriber resource={resourceB}>
          {({ data, loading }) => {
            if (loading) {
              return <div>{componentRenderSpy(`loading:B`)}</div>;
            }

            let message = '';

            if (data === null) {
              message = 'isNullAndCleanedByTransitionIntoB';
            } else {
              message = String(data);
            }

            return <div>{componentRenderSpy(`data:${message}`)}</div>;
          }}
        </ResourceSubscriber>
      );

      const routes = [
        {
          ...mockRoute,
          path: '/bar/:key',
          component: ComponentB,
          resources: [resourceA, resourceB],
        },
      ];

      jest.spyOn(global.Date, 'now').mockReturnValue(100);

      // We start at route fooA
      const historyPush = await mountAppSetInitialLocationAndGetHistoryPush(
        routes,
        '/bar/first-key'
      );

      const { data: dataA1 } = getResourceStoreStateData().TYPE_B.KEY_B;

      jest.spyOn(global.Date, 'now').mockReturnValue(150);

      // We go to routeB
      historyPush('/bar/second-key');

      await nextTick();

      const { data: dataA2 } = getResourceStoreStateData().TYPE_B.KEY_B;

      expect(dataA1 === dataA2).toBeTruthy();
      expect(componentRenderStates.includes('data:null')).toBeFalsy();
    });
  });
});
