import { mount } from 'enzyme';
import * as history4 from 'history';
import * as history5 from 'history-5';
import React from 'react';
import { defaultRegistry } from 'react-sweet-state';

import * as isServerEnvironment from '../../common/utils/is-server-environment';

import { ContainerProps } from './types';

import {
  createRouterSelector,
  getRouterState,
  getRouterStore,
  INITIAL_STATE,
  RouterContainer,
} from './index';

describe('RouterStore', () => {
  describe.each([
    ['v4', history4],
    ['v5', history5],
  ])('with history %s', (_, historyApi) => {
    const { createMemoryHistory } = historyApi;
    const location = {
      pathname: '/pages',
      search: '?key=value',
      hash: '#hash',
    };

    const routes = [
      {
        path: '/pages',
        component: () => <div>pages</div>,
        exact: true,
        name: 'pages',
      },
      {
        path: '/pages/:id',
        component: () => <div>page</div>,
        name: 'page',
      },
    ];

    function renderRouterContainer(props: Partial<ContainerProps> = {}) {
      const history = createMemoryHistory({ initialEntries: [location] });
      const listen = jest.spyOn(history, 'listen');
      const push = jest.spyOn(history, 'push');
      const replace = jest.spyOn(history, 'replace');

      const plugins = props.plugins || [];

      mount(
        <RouterContainer
          history={history}
          isGlobal
          plugins={plugins}
          routes={routes}
          {...props}
        />
      );

      return {
        actions: getRouterStore().actions,
        getState: getRouterState,
        history: Object.assign({}, history, {
          listen,
          push,
          replace,
        }),
        plugins,
      };
    }

    beforeEach(() => {
      Object.defineProperty(window, 'location', {
        value: {
          assign: jest.fn(),
          href: 'http://localhost:3000',
          replace: jest.fn(),
        },
      });

      jest
        .spyOn(isServerEnvironment, 'isServerEnvironment')
        .mockReturnValue(false);
    });

    afterEach(() => {
      defaultRegistry.stores.clear();
      jest.restoreAllMocks();
    });

    it('returns the default state when the container is not initialised', () => {
      expect(getRouterState()).toEqual({
        ...INITIAL_STATE,
        history: expect.objectContaining({
          block: expect.any(Function),
          createHref: expect.any(Function),
          goBack: expect.any(Function),
          goForward: expect.any(Function),
          listen: expect.any(Function),
          push: expect.any(Function),
          replace: expect.any(Function),
        }),
      });
    });

    describe('when the container is rendered', () => {
      it('calls history.listen() in a client environment', () => {
        const { history } = renderRouterContainer();

        expect(history.listen).toHaveBeenCalledTimes(1);
      });

      it('does not call history.listen() in a server environment', () => {
        jest
          .spyOn(isServerEnvironment, 'isServerEnvironment')
          .mockReturnValue(true);

        const { history } = renderRouterContainer();

        expect(history.listen).not.toHaveBeenCalled();
      });

      it('returns the expected state', () => {
        const onPrefetch = jest.fn();
        const { history, getState, plugins } = renderRouterContainer({
          onPrefetch,
        });

        expect(getState()).toMatchObject({
          ...INITIAL_STATE,
          history,
          location,
          match: {
            isExact: true,
            params: expect.any(Object),
            path: location.pathname,
            query: expect.any(Object),
            url: location.pathname,
          },
          onPrefetch,
          query: {
            key: 'value',
          },
          route: routes[0],
          routes: routes,
          unlisten: expect.any(Function),
          plugins,
        });
      });

      it('plugin routeLoad is called on initial render', () => {
        const plugin = {
          id: 'test-plugin',
          routeLoad: jest.fn(),
        };
        const plugins = [plugin];

        renderRouterContainer({
          plugins,
        });

        expect(plugin.routeLoad).toBeCalled();
      });
    });

    describe('push()', () => {
      describe.each([undefined, '/base-path'])('with %s basePath', basePath => {
        it('pushes a relative path given a relative path', async () => {
          const { actions, getState, history } = renderRouterContainer({
            basePath,
          });

          actions.push('/pages/1');

          expect(history.push).toBeCalledWith(
            `${basePath ?? ''}/pages/1`,
            undefined
          );

          expect(getState()).toMatchObject({
            action: 'PUSH',
            route: routes[1],
          });
        });

        if (!basePath) {
          it('pushes a relative path given an absolute URL on the same domain', async () => {
            const { actions, getState, history } = renderRouterContainer();

            actions.push(`http://localhost:3000${basePath ?? ''}/pages/1`);

            expect(history.push).toBeCalledWith(
              `${basePath ?? ''}/pages/1`,
              undefined
            );
            expect(getState()).toMatchObject({
              action: 'PUSH',
              route: routes[1],
            });
          });

          it('pushes a relative path given an absolute URL on the same domain', async () => {
            const { actions, getState, history } = renderRouterContainer();

            actions.push(`http://localhost:3000/pages/1`);

            expect(history.push).toBeCalledWith('/pages/1', undefined);
            expect(getState()).toMatchObject({
              action: 'PUSH',
              route: routes[1],
            });
          });

          it('pushes a relative Location object given a relative Location object', async () => {
            const { actions, getState, history } = renderRouterContainer();
            const nextLocation = { pathname: '/pages/1', search: '', hash: '' };

            actions.push(nextLocation);

            expect(history.push).toBeCalledWith(nextLocation, undefined);
            expect(getState()).toMatchObject({
              action: 'PUSH',
              route: routes[1],
            });
          });

          it('plugin route load actions are called on route change', async () => {
            const plugin = {
              id: 'test-plugin',
              beforeRouteLoad: jest.fn(),
              routeLoad: jest.fn(),
            };
            const plugins = [plugin];

            const { actions } = renderRouterContainer({
              plugins,
            });
            const nextLocation = { pathname: '/pages/1', search: '', hash: '' };

            actions.push(nextLocation);

            expect(plugin.beforeRouteLoad).toBeCalledWith({
              nextContext: {
                match: {
                  isExact: true,
                  params: { id: '1' },
                  path: '/pages/:id',
                  query: {},
                  url: '/pages/1',
                },
                query: {},
                route: {
                  component: routes[1].component,
                  name: 'page',
                  path: '/pages/:id',
                },
              },
              context: {
                match: {
                  isExact: true,
                  params: {},
                  path: '/pages',
                  query: {},
                  url: '/pages',
                },
                query: { key: 'value' },
                route: {
                  component: routes[0].component,
                  exact: true,
                  name: 'pages',
                  path: '/pages',
                },
              },
            });

            // ignore onRouteLoad call on initial render and check the one after route change
            expect(plugin.routeLoad.mock.calls[1]).toEqual([
              {
                context: {
                  match: {
                    isExact: true,
                    params: { id: '1' },
                    path: '/pages/:id',
                    query: {},
                    url: '/pages/1',
                  },
                  query: {},
                  route: {
                    component: routes[1].component,
                    name: 'page',
                    path: '/pages/:id',
                  },
                },
                prevContext: {
                  match: {
                    isExact: true,
                    params: {},
                    path: '/pages',
                    query: {},
                    url: '/pages',
                  },
                  query: { key: 'value' },
                  route: {
                    component: routes[0].component,
                    exact: true,
                    name: 'pages',
                    path: '/pages',
                  },
                },
              },
            ]);
          });

          it('plugin route load actions are called only if route path/match/query change', async () => {
            const plugin = {
              id: 'test-plugin',
              beforeRouteLoad: jest.fn(),
              routeLoad: jest.fn(),
            };
            const resourcesPlugin = {
              id: 'resources-plugin',
              beforeRouteLoad: jest.fn(),
              routeLoad: jest.fn(),
            };
            const plugins = [plugin, resourcesPlugin];

            const { actions } = renderRouterContainer({
              plugins,
            });
            const nextLocation = {
              pathname: '/pages',
              search: '?a=1&b=2',
              hash: '',
            };

            actions.push(nextLocation);

            // Plugin actions would not be called as path/match/query does not change
            expect(plugin.beforeRouteLoad).not.toBeCalled();
            expect(plugin.routeLoad).toHaveBeenCalledTimes(1); // called only on router init

            // For Resources plugin keeping old behaviour
            expect(resourcesPlugin.beforeRouteLoad).toBeCalled();
            expect(resourcesPlugin.routeLoad).toHaveBeenCalledTimes(2); // called both on router init and URL change
          });
        }
      });

      it('calls location.assign given an absolute URL on a different domain', () => {
        const assign = jest.spyOn(window.location, 'assign');
        const { actions } = renderRouterContainer();

        actions.push('http://example.com');

        expect(assign).toBeCalledWith('http://example.com');
      });

      it('passes state when passed to push', () => {
        const basePath = '/base-path';
        const { actions, getState, history } = renderRouterContainer({
          basePath,
        });

        const pushedState = { ids: [1, 2, 3, 4, 5] };
        actions.push('/pages/1', pushedState);

        expect(history.push).toBeCalledWith(
          `${basePath ?? ''}/pages/1`,
          pushedState
        );

        expect(getState()).toMatchObject({
          action: 'PUSH',
          route: routes[1],
          state: pushedState,
        });
      });
    });

    describe('pushTo()', () => {
      it('pushes a relative path generated from the route and parameters', () => {
        const route = routes[1];
        const { actions, getState, history } = renderRouterContainer();

        actions.pushTo(route, { params: { id: '1' }, query: { uid: '1' } });

        expect(history.push).toBeCalledWith({
          hash: '',
          pathname: '/pages/1',
          search: '?uid=1',
        });

        expect(getState()).toMatchObject({
          action: 'PUSH',
          route,
        });
      });
    });

    describe('replace()', () => {
      describe.each([undefined, '/base-path'])('with %s basePath', basePath => {
        it('replaces a relative path given a relative path', async () => {
          const { actions, getState, history } = renderRouterContainer({
            basePath,
          });

          actions.replace('/pages/1');

          expect(history.replace).toBeCalledWith(`${basePath ?? ''}/pages/1`);
          expect(getState()).toMatchObject({
            action: 'REPLACE',
            route: routes[1],
          });
        });
      });

      it('replaces an absolute URL on the same domain with a relative path', () => {
        const path = 'http://localhost:3000/pages/1';
        const { actions, getState, history } = renderRouterContainer();

        actions.replace(path);

        expect(history.replace).toBeCalledWith('/pages/1');
        expect(getState()).toMatchObject({
          action: 'REPLACE',
          route: routes[1],
        });
      });

      it('calls window.location.replace with an absolute URL on a different domain', () => {
        const replace = jest.spyOn(window.location, 'replace');
        const { actions } = renderRouterContainer();

        actions.replace('http://example.com');

        expect(replace).toBeCalledWith('http://example.com');
      });
    });

    describe('replaceTo()', () => {
      it('replaces a route and parameters with a relative path', () => {
        const route = routes[1];
        const { actions, getState, history } = renderRouterContainer();

        actions.replaceTo(route, { params: { id: '1' }, query: { uid: '1' } });

        expect(history.replace).toBeCalledWith({
          hash: '',
          pathname: '/pages/1',
          search: '?uid=1',
        });

        expect(getState()).toMatchObject({
          action: 'REPLACE',
          route,
        });
      });
    });

    describe('createRouterSelector()', () => {
      it('should return selected state', () => {
        const routeNameSelector = jest
          .fn()
          .mockImplementation(s => s.route.name);

        const useRouteName = createRouterSelector(routeNameSelector);
        const RouteName = () => <>{useRouteName()}</>;

        const route = {
          component: () => null,
          name: 'home',
          path: '',
        };

        const wrapper = mount(
          <RouterContainer
            history={createMemoryHistory()}
            plugins={[]}
            routes={[route]}
          >
            <RouteName />
          </RouterContainer>
        );

        expect(routeNameSelector).toBeCalledWith(
          expect.objectContaining({ route }),
          undefined
        );
        expect(wrapper.html()).toEqual('home');
      });

      it('should pass through single hook argument to selector', () => {
        const routeNameSelector = jest
          .fn()
          .mockImplementation(s => s.route.name);

        const useRouteName = createRouterSelector(routeNameSelector);

        const RouteName = ({ argument }: { argument: unknown }) => (
          <>{useRouteName(argument)}</>
        );

        const route = {
          component: () => null,
          name: 'home',
          path: '',
        };

        const wrapper = mount(
          <RouterContainer
            history={createMemoryHistory()}
            plugins={[]}
            routes={[route]}
          >
            <RouteName argument="bar" />
          </RouterContainer>
        );

        expect(routeNameSelector).toBeCalledWith(
          expect.objectContaining({ route }),
          'bar'
        );
        expect(wrapper.html()).toEqual('home');
      });
    });
  });
});
