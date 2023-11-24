import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { createMemoryHistory } from 'history';
import React, { Fragment } from 'react';
import { defaultRegistry } from 'react-sweet-state';

import { isServerEnvironment } from '../../common/utils/is-server-environment';
import { Route, RouteComponent, Router, invokePluginLoad } from '../../index';
import {
  RouteResource,
  useResource,
  createResource,
  ResourceStore,
  createResourcesPlugin,
} from '../index';

jest.mock('../../common/utils/is-server-environment');

describe('<Router /> with resources client-side integration tests', () => {
  beforeEach(() => {
    (isServerEnvironment as any).mockReturnValue(false);
  });

  afterEach(() => {
    defaultRegistry.stores.clear();
    jest.useRealTimers();
  });

  it('re-triggers requests for timed out resources when mounted', async () => {
    const resolver = (resolveWith: any, delay = 0) =>
      new Promise(resolve => setTimeout(() => resolve(resolveWith), delay));

    const completedResource = createResource({
      getKey: () => 'key',
      getData: () => resolver('completed', 250),
      type: 'COMPLETED',
    });

    const timeoutResource = createResource({
      getKey: () => 'key',
      getData: () => resolver('timeout', 500),
      type: 'TIMEOUT',
    });

    const location = '/pathname?search=search#hash=hash';
    const getCompletedData = jest.spyOn(completedResource, 'getData');
    const getTimeoutData = jest.spyOn(timeoutResource, 'getData');

    const route = {
      component: () => <div>test</div>,
      name: 'mock-route',
      path: location.substring(0, location.indexOf('?')),
      resources: [completedResource, timeoutResource],
    };

    const history = createMemoryHistory({ initialEntries: [location] });

    const resourcesPlugin = createResourcesPlugin({
      timeout: 350,
    });

    const plugins = [resourcesPlugin];

    invokePluginLoad(plugins, {
      history,
      routes: [route],
    });

    const serverData = await resourcesPlugin.getSerializedResources();

    expect(getCompletedData).toHaveBeenCalledTimes(1);
    expect(getTimeoutData).toHaveBeenCalledTimes(1);

    expect(serverData).toEqual({
      COMPLETED: {
        key: {
          data: 'completed',
          error: null,
          expiresAt: null,
          key: undefined,
          loading: false,
          promise: null,
          accessedAt: null,
        },
      },
      TIMEOUT: {
        key: {
          data: null,
          error: {
            message: 'Resource timed out: TIMEOUT',
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
    });

    defaultRegistry.stores.clear();

    jest.useFakeTimers();

    render(
      <Router
        history={history}
        plugins={[
          createResourcesPlugin({
            resourceData: serverData,
          }),
        ]}
        routes={[route]}
      />
    );

    jest.runAllTimers();

    // Await a fake promise to let route resources to complete
    await Promise.resolve();

    expect(getCompletedData).toHaveBeenCalledTimes(1);
    expect(getTimeoutData).toHaveBeenCalledTimes(2);

    const resourceStore = defaultRegistry.getStore(ResourceStore);

    expect(resourceStore.storeState.getState()).toEqual({
      context: {},
      data: {
        COMPLETED: {
          key: {
            data: 'completed',
            error: null,
            expiresAt: expect.any(Number),
            key: undefined,
            loading: false,
            promise: expect.any(Promise),
            accessedAt: expect.any(Number),
          },
        },
        TIMEOUT: {
          key: {
            data: 'timeout',
            error: null,
            expiresAt: expect.any(Number),
            key: undefined,
            loading: false,
            promise: expect.any(Promise),
            accessedAt: expect.any(Number),
          },
        },
      },
      executing: null,
      prefetching: null,
    });
  });

  describe('renders the next route with', () => {
    function renderRouter(routes: Route[]) {
      const history = createMemoryHistory({ initialEntries: [routes[0].path] });
      const push: any = jest.spyOn(history, 'push');

      render(
        <Router
          history={history}
          plugins={[createResourcesPlugin({})]}
          routes={routes}
        >
          {/* Assuming RouteComponent and other relevant components are correctly set up */}
          <RouteComponent />
        </Router>
      );

      return { history, push };
    }

    function createResources() {
      let cached = 0;
      let network = 0;

      return {
        cacheResource: createResource({
          getData: () => {
            cached += 1;

            return Promise.resolve(`cache-${cached}`);
          },
          getKey: () => 'cache',
          maxAge: Infinity,
          type: 'CACHE',
        }),
        networkResource: createResource({
          getData: () => {
            network += 1;

            return Promise.resolve(`network-${network}`);
          },
          getKey: () => 'network',
          maxAge: 0,
          type: 'NETWORK',
        }),
      };
    }

    function createResourceComponent(resource: RouteResource<string>) {
      return () => {
        const { data, error, loading } = useResource(resource);
        if (error) {
          return <>error:{error}</>;
        }

        if (loading) {
          return <>loading:{resource.type.toLowerCase()}</>;
        }

        return <>data:{data?.toString()}</>;
      };
    }

    function createComponent(resources: RouteResource<string>[]) {
      const components = resources.map(createResourceComponent);

      return () => {
        return (
          <>
            {components.map((Component, index) => (
              <Fragment key={index}>
                <Component />
                {index < components.length - 1 ? ' ' : ''}
              </Fragment>
            ))}
          </>
        );
      };
    }

    it('previous data when transitioning to the same route and resource keys', async () => {
      const { cacheResource, networkResource } = createResources();
      const route = {
        component: createComponent([cacheResource, networkResource]),
        name: 'page-1',
        path: '/pages/1',
        resources: [cacheResource, networkResource],
      };

      const { history } = renderRouter([route]);

      expect(screen.getByText(/loading:\s*cache/i)).toBeInTheDocument();
      expect(screen.getByText(/loading:\s*network/i)).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText(/data:\s*cache-1/i)).toBeInTheDocument();
        expect(screen.getByText(/data:\s*network-1/i)).toBeInTheDocument();
      });

      history.push(route.path + '?query#hash');

      await waitFor(() => {
        expect(screen.getByText(/data:\s*cache-1/i)).toBeInTheDocument();
        expect(screen.getByText(/data:\s*network-1/i)).toBeInTheDocument();
      });
    });

    it('fresh data when transitioning to a new route', async () => {
      const { cacheResource, networkResource } = createResources();
      const component = createComponent([cacheResource, networkResource]);

      const routes = [
        {
          component,
          name: 'page-1',
          path: '/pages/1',
          resources: [cacheResource, networkResource],
        },
        {
          component,
          name: 'page-2',
          path: '/pages/2',
          resources: [cacheResource, networkResource],
        },
      ];

      const { history } = renderRouter(routes);

      expect(screen.getByText(/loading:\s*cache/i)).toBeInTheDocument();
      expect(screen.getByText(/loading:\s*network/i)).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText(/data:\s*cache-1/i)).toBeInTheDocument();
        expect(screen.getByText(/data:\s*network-1/i)).toBeInTheDocument();
      });

      history.push(routes[1].path);

      await waitFor(() => {
        expect(screen.getByText(/data:\s*cache-1/i)).toBeInTheDocument();
        expect(screen.getByText(/loading:\s*network/i)).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText(/data:\s*cache-1/i)).toBeInTheDocument();
        expect(screen.getByText(/data:\s*network-2/i)).toBeInTheDocument();
      });
    });
  });
});

describe('<Router /> server-side integration tests', () => {
  const route = {
    component: () => <>route component</>,
    name: '',
    path: '/path',
  };

  beforeEach(() => {
    (isServerEnvironment as any).mockReturnValue(true);
  });

  it('renders the expected route when basePath is set', async () => {
    render(
      <Router
        basePath="/base-path"
        history={createMemoryHistory({
          initialEntries: [`/base-path${route.path}`],
        })}
        plugins={[createResourcesPlugin({})]}
        routes={[route]}
      >
        <RouteComponent />
      </Router>
    );

    expect(screen.getByText('route component')).toBeInTheDocument();
  });

  it('renders the expected route when basePath is not set', async () => {
    render(
      <Router
        history={createMemoryHistory({
          initialEntries: [route.path],
        })}
        plugins={[createResourcesPlugin({})]}
        routes={[route]}
      >
        <RouteComponent />
      </Router>
    );

    expect(screen.getByText('route component')).toBeInTheDocument();
  });
});
