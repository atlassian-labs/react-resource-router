import { mount } from 'enzyme';
import { createMemoryHistory } from 'history';
import React from 'react';
import { defaultRegistry } from 'react-sweet-state';

import { isServerEnvironment } from '../common/utils/is-server-environment';
import { createResource, ResourceStore } from '../controllers/resource-store';
import {
  RouteComponent,
  Router,
  RouterActions,
  RouterActionsType,
  StaticRouter,
} from '../index';

jest.mock('../common/utils/is-server-environment');

describe('<Router /> client-side integration tests', () => {
  beforeEach(() => {
    (isServerEnvironment as any).mockReturnValue(false);
  });

  afterEach(() => {
    defaultRegistry.stores.clear();
  });

  describe('sends the expected path to history', () => {
    function renderRouter(basePath?: string) {
      const history = createMemoryHistory();
      const push = jest.spyOn(history, 'push');
      const replace = jest.spyOn(history, 'replace');

      let routerActions = {} as RouterActionsType;
      mount(
        <Router basePath={basePath} history={history} routes={[]}>
          <RouterActions>
            {actions => {
              routerActions = actions;

              return null;
            }}
          </RouterActions>
        </Router>
      );

      return {
        history: {
          push,
          replace,
        },
        routerActions,
      };
    }

    it('when basePath is set', async () => {
      const { history, routerActions } = renderRouter('/basepath');

      routerActions.push('/push');
      expect(history.push).toHaveBeenCalledWith('/basepath/push');

      routerActions.replace('/replace');
      expect(history.replace).toHaveBeenCalledWith('/basepath/replace');
    });

    it('when basePath is not set', async () => {
      const { history, routerActions } = renderRouter();

      routerActions.push('/push');
      expect(history.push).toBeCalledWith('/push');

      routerActions.replace('/replace');
      expect(history.replace).toBeCalledWith('/replace');
    });
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
      component: () => <div>foo</div>,
      name: 'mock-route',
      path: location.substring(0, location.indexOf('?')),
      resources: [completedResource, timeoutResource],
    };

    const serverData = await StaticRouter.requestResources({
      location,
      routes: [route],
      timeout: 350,
    });

    expect(getCompletedData).toHaveBeenCalledTimes(1);
    expect(getTimeoutData).toHaveBeenCalledTimes(1);

    expect(serverData).toEqual({
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
    });

    defaultRegistry.stores.clear();

    jest.useFakeTimers();

    mount(
      <Router
        history={createMemoryHistory({
          initialEntries: [location],
        })}
        resourceData={serverData}
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
      },
      executing: null,
      prefetching: null,
    });
  });
});

describe('<StaticRouter /> server-side integration tests', () => {
  const route = {
    component: () => <>route component</>,
    name: '',
    path: '/path',
  };

  beforeEach(() => {
    (isServerEnvironment as any).mockReturnValue(true);
  });

  it('should match the right route when basePath is set', async () => {
    const wrapper = mount(
      <StaticRouter
        basePath="/basepath"
        location={`/basepath${route.path}`}
        routes={[route]}
      >
        <RouteComponent />
      </StaticRouter>
    );

    expect(wrapper.text()).toBe('route component');
  });

  it('should match the right route when basePath is not set', async () => {
    const wrapper = mount(
      <StaticRouter location={route.path} routes={[route]}>
        <RouteComponent />
      </StaticRouter>
    );

    expect(wrapper.text()).toBe('route component');
  });
});
