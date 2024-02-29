import { act, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { createMemoryHistory } from 'history';
import React, { StrictMode } from 'react';
import { defaultRegistry } from 'react-sweet-state';

import { isServerEnvironment } from '../common/utils/is-server-environment';
import { Route, RouteComponent, Router, type Plugin } from '../index';

jest.mock('../common/utils/is-server-environment');

describe('<Router /> client-side integration tests', () => {
  beforeEach(() => {
    (isServerEnvironment as any).mockReturnValue(false);
  });

  afterEach(() => {
    defaultRegistry.stores.clear();
    jest.useRealTimers();
  });

  function mountRouter({
    routes,
    plugins = [],
    location,
    strictMode,
  }: {
    routes: Route[];
    plugins?: Plugin[];
    location?: string;
    strictMode: boolean;
  }) {
    const history = createMemoryHistory({
      initialEntries: [location || routes[0].path],
    });

    render(
      strictMode ? (
        <StrictMode>
          <Router history={history} plugins={plugins} routes={routes}>
            <RouteComponent />
          </Router>
        </StrictMode>
      ) : (
        <Router history={history} plugins={plugins} routes={routes}>
          <RouteComponent />
        </Router>
      )
    );

    return { history };
  }

  const strictModeStates = ['on', 'off'];

  for (const strictModeState of strictModeStates) {
    const strictMode = strictModeState === 'on';

    it(`renders route: strict mode ${strictModeState}`, () => {
      const location = '/pathname?search=search#hash=hash';
      const route = {
        component: () => <div>test</div>,
        name: 'mock-route',
        path: location.substring(0, location.indexOf('?')),
      };

      mountRouter({ routes: [route], strictMode });

      expect(screen.getByText('test')).toBeInTheDocument();
    });

    it(`triggers plugin.loadRoute when mounted: strict mode ${strictModeState}`, () => {
      const location = '/pathname?search=search#hash=hash';
      const route = {
        component: () => <div>test</div>,
        name: 'mock-route',
        path: location.substring(0, location.indexOf('?')),
      };

      const plugin: Plugin = {
        id: 'test-plugin',
        routeLoad: jest.fn(),
      };

      mountRouter({
        routes: [route],
        plugins: [plugin],
        strictMode,
      });

      expect(plugin.routeLoad).toBeCalled();
    });

    it(`renders next route: strict mode ${strictModeState}`, () => {
      const location = '/pathname?search=search#hash=hash';
      const route = {
        component: () => <div>first route</div>,
        name: 'mock-route',
        path: location.substring(0, location.indexOf('?')),
      };

      const route2 = {
        component: () => <div>second route</div>,
        name: 'mock-route2',
        path: '/route2',
      };

      const { history } = mountRouter({
        routes: [route, route2],
        strictMode,
      });

      expect(screen.getByText('first route')).toBeInTheDocument();

      act(() => {
        history.push('/route2');
      });

      expect(screen.getByText('second route')).toBeInTheDocument();
    });

    it(`triggers plugin.loadRoute after URL change : strict mode ${strictModeState}`, async () => {
      const location = '/pathname?search=search#hash=hash';
      const route = {
        component: () => <div>first route</div>,
        name: 'mock-route',
        path: location.substring(0, location.indexOf('?')),
      };

      const route2 = {
        component: () => <div>second route</div>,
        name: 'mock-route2',
        path: '/route2',
      };

      const plugin: Plugin = {
        id: 'test-plugin',
        routeLoad: jest.fn(),
      };

      const { history } = mountRouter({
        routes: [route, route2],
        plugins: [plugin],
        strictMode,
      });

      expect(plugin.routeLoad).toBeCalled();

      act(() => {
        history.push('/route2');
      });

      expect((plugin.routeLoad as any).mock.calls[1][0].context.route).toBe(
        route2
      );
    });

    describe(`route re-rendering: strict mode ${strictModeState}`, () => {
      it(`route loaded once as URL pathname did not change: strict mode ${strictModeState}`, () => {
        const location = '/pathname?search=search#hash=hash';
        const route = {
          component: () => <div>first route</div>,
          name: 'mock-route',
          path: location.substring(0, location.indexOf('?')),
        };

        const plugin: Plugin = {
          id: 'test-plugin',
          routeLoad: jest.fn(),
        };

        const { history } = mountRouter({
          routes: [route],
          plugins: [plugin],
          strictMode,
        });

        expect(plugin.routeLoad).toBeCalled();

        act(() => {
          history.push('/pathname?search=blah-blah-blah');
        });

        expect(plugin.routeLoad).toBeCalledTimes(1);
      });

      it(`route loads twice as query params change: strict mode ${strictModeState}`, () => {
        const location = '/pathname?search=search#hash=hash';
        const route = {
          component: () => <div>first route</div>,
          name: 'mock-route',
          query: ['search'],
          path: location.substring(0, location.indexOf('?')),
        };

        const plugin: Plugin = {
          id: 'test-plugin',
          routeLoad: jest.fn(),
        };

        const { history } = mountRouter({
          routes: [route],
          plugins: [plugin],
          location,
          strictMode,
        });

        expect(plugin.routeLoad).toBeCalled();

        act(() => {
          history.push('/pathname?search=blah-blah-blah');
        });

        expect(plugin.routeLoad).toBeCalledTimes(2);
      });

      it(`route loads once as defined query param did not change: strict mode ${strictModeState}`, () => {
        const location = '/pathname?search=search';
        const route = {
          component: () => <div>first route</div>,
          name: 'mock-route',
          query: ['search'],
          path: location.substring(0, location.indexOf('?')),
        };

        const plugin: Plugin = {
          id: 'test-plugin',
          routeLoad: jest.fn(),
        };

        const { history } = mountRouter({
          routes: [route],
          plugins: [plugin],
          location,
          strictMode,
        });

        expect(plugin.routeLoad).toBeCalled();

        act(() => {
          history.push('/pathname?search=search&issue-key=1');
        });

        expect(plugin.routeLoad).toBeCalledTimes(1);
      });
    });

    describe(`<Router /> server-side integration tests: strict mode ${strictModeState}`, () => {
      const route = {
        component: () => <>route component</>,
        name: '',
        path: '/path',
      };

      beforeEach(() => {
        (isServerEnvironment as any).mockReturnValue(true);
      });

      it(`renders the expected route when basePath is set: strict mode ${strictModeState}`, () => {
        render(
          strictMode ? (
            <StrictMode>
              <Router
                basePath="/base-path"
                history={createMemoryHistory({
                  initialEntries: [`/base-path${route.path}`],
                })}
                plugins={[]}
                routes={[route]}
              >
                <RouteComponent />
              </Router>
            </StrictMode>
          ) : (
            <Router
              basePath="/base-path"
              history={createMemoryHistory({
                initialEntries: [`/base-path${route.path}`],
              })}
              plugins={[]}
              routes={[route]}
            >
              <RouteComponent />
            </Router>
          )
        );

        expect(screen.getByText('route component')).toBeInTheDocument();
      });

      it(`renders the expected route when basePath is not set: strict mode ${strictModeState}`, () => {
        render(
          strictMode ? (
            <StrictMode>
              <Router
                history={createMemoryHistory({
                  initialEntries: [route.path],
                })}
                plugins={[]}
                routes={[route]}
              >
                <RouteComponent />
              </Router>
            </StrictMode>
          ) : (
            <Router
              history={createMemoryHistory({
                initialEntries: [route.path],
              })}
              plugins={[]}
              routes={[route]}
            >
              <RouteComponent />
            </Router>
          )
        );

        expect(screen.getByText('route component')).toBeInTheDocument();
      });
    });
  }
});
