import { act, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { createMemoryHistory } from 'history';
import React, { StrictMode } from 'react';
import { defaultRegistry } from 'react-sweet-state';

import { isServerEnvironment } from '../common/utils/is-server-environment';
import {
  Route,
  RouteComponent,
  Router,
  type Plugin,
  usePathParam,
  useQueryParam,
} from '../index';

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

      expect(plugin.routeLoad).toHaveBeenCalled();
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

      expect(plugin.routeLoad).toHaveBeenCalled();

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

        expect(plugin.routeLoad).toHaveBeenCalled();

        act(() => {
          history.push('/pathname?search=blah-blah-blah');
        });

        expect(plugin.routeLoad).toHaveBeenCalledTimes(1);
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

        expect(plugin.routeLoad).toHaveBeenCalled();

        act(() => {
          history.push('/pathname?search=blah-blah-blah');
        });

        expect(plugin.routeLoad).toHaveBeenCalledTimes(2);
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

        expect(plugin.routeLoad).toHaveBeenCalled();

        act(() => {
          history.push('/pathname?search=search&issue-key=1');
        });

        expect(plugin.routeLoad).toHaveBeenCalledTimes(1);
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

    describe(`path matching integration tests: strict mode ${strictModeState}`, () => {
      it('matches dynamic route with optional parameter', () => {
        const MigrationComponent = () => {
          const [step] = usePathParam('step');
          const [migrationId] = usePathParam('migrationId');

          return (
            <div>
              Step: {step}, Migration ID: {migrationId || 'N/A'}
            </div>
          );
        };

        const route = {
          name: 'migration',
          path: '/settings/system/migration/:step/:migrationId?',
          component: MigrationComponent,
        };
        const { history } = mountRouter({ routes: [route], strictMode: true });

        act(() => {
          history.push('/settings/system/migration/plan-configuration/123');
        });

        expect(
          screen.getByText('Step: plan-configuration, Migration ID: 123')
        ).toBeInTheDocument();
      });

      it('matches route with regex constraint on path parameter', () => {
        const PlanComponent = () => {
          const [planId] = usePathParam('planId');

          return <div>Plan ID: {planId}</div>;
        };

        const route = {
          name: 'plans',
          path: '/plans/:planId(\\d+)',
          component: PlanComponent,
        };
        const { history } = mountRouter({ routes: [route], strictMode: true });

        act(() => {
          history.push('/plans/456');
        });

        expect(screen.getByText('Plan ID: 456')).toBeInTheDocument();
      });

      it('matches route with multiple dynamic parameters', () => {
        const ProjectAppComponent = () => {
          const [projectType] = usePathParam('projectType');
          const [projectKey] = usePathParam('projectKey');
          const [appId] = usePathParam('appId');

          return (
            <div>
              Project Type: {projectType}, Project Key: {projectKey}, App ID:{' '}
              {appId}
            </div>
          );
        };

        const route = {
          name: 'project-app',
          path: '/app/:projectType(software|servicedesk)/projects/:projectKey/apps/:appId',
          component: ProjectAppComponent,
        };
        const { history } = mountRouter({ routes: [route], strictMode: true });

        act(() => {
          history.push('/app/software/projects/PROJ123/apps/456');
        });

        expect(
          screen.getByText(
            'Project Type: software, Project Key: PROJ123, App ID: 456'
          )
        ).toBeInTheDocument();
      });

      it('matches route with dynamic and query parameters', () => {
        const IssueComponent = () => {
          const [issueKey] = usePathParam('issueKey');
          const [queryParam] = useQueryParam('query');

          return (
            <div>
              Issue Key: {issueKey}, Query: {queryParam || 'None'}
            </div>
          );
        };

        const route = {
          name: 'browse',
          path: '/browse/:issueKey(\\w+-\\d+)',
          component: IssueComponent,
        };
        const { history } = mountRouter({ routes: [route], strictMode: true });

        act(() => {
          history.push('/browse/ISSUE-123?query=details');
        });

        expect(
          screen.getByText('Issue Key: ISSUE-123, Query: details')
        ).toBeInTheDocument();
      });

      it('matches route with complex regex constraint on path parameter and wildcard', () => {
        const IssueComponent = () => {
          const [issueKey] = usePathParam('issueKey');

          return <div>Issue Key: {issueKey}</div>;
        };

        const route = {
          name: 'browse',
          path: '/browse/:issueKey(\\w+-\\d+)(.*)?',
          component: IssueComponent,
        };
        const { history } = mountRouter({ routes: [route], strictMode: true });

        act(() => {
          history.push('/browse/ISSUE-123/details');
        });

        expect(screen.getByText('Issue Key: ISSUE-123')).toBeInTheDocument();
      });

      it('matches route with multiple dynamic segments and regex constraints', () => {
        const SettingsComponent = () => {
          const [settingsType] = usePathParam('settingsType');
          const [appId] = usePathParam('appId');
          const [envId] = usePathParam('envId');
          const [route] = usePathParam('route');

          return (
            <div>
              Settings Type: {settingsType}, App ID: {appId}, Environment ID:{' '}
              {envId}, Route: {route || 'None'}
            </div>
          );
        };

        const route = {
          name: 'settings',
          path: '/settings/apps/:settingsType(configure|get-started)/:appId/:envId/:route?',
          component: SettingsComponent,
        };
        const { history } = mountRouter({ routes: [route], strictMode: true });

        act(() => {
          history.push('/settings/apps/configure/app123/env456/setup');
        });

        expect(
          screen.getByText(
            'Settings Type: configure, App ID: app123, Environment ID: env456, Route: setup'
          )
        ).toBeInTheDocument();
      });

      it('matches route with regex constraint and renders wildcard route for invalid paths', () => {
        const IssueComponent = () => {
          const [issueKey] = usePathParam('issueKey');

          return <div>Issue Key: {issueKey}</div>;
        };

        const NotFoundComponent = () => <div>Not Found</div>;

        const routes = [
          {
            name: 'issue',
            path: '/browse/:issueKey(\\w+-\\d+)(.*)?',
            component: IssueComponent,
          },
          {
            name: 'wildcard',
            path: '/',
            component: NotFoundComponent,
          },
        ];
        const { history } = mountRouter({ routes, strictMode: true });

        act(() => {
          history.push('/browse/TEST-1');
        });
        expect(screen.getByText('Issue Key: TEST-1')).toBeInTheDocument();

        act(() => {
          history.push('/browse/1');
        });
        expect(screen.getByText('Not Found')).toBeInTheDocument();

        act(() => {
          history.push('/browse/TEST');
        });
        expect(screen.getByText('Not Found')).toBeInTheDocument();
      });
    });
  }
});
