import { mount } from 'enzyme';
import { createMemoryHistory } from 'history';
import React, { ReactNode } from 'react';

import { Route } from '../../common/types';
import * as isServerEnvironment from '../../common/utils/is-server-environment';
import { createResourcesPlugin } from '../../resources/plugin';
import { createResource, getResourceStore } from '../resource-store';

import { Router } from './index';

describe('<Router />', () => {
  const history = createMemoryHistory();
  const routes: Route[] = [];

  beforeEach(() => {
    jest
      .spyOn(isServerEnvironment, 'isServerEnvironment')
      .mockReturnValue(false);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders a RouterContainer', () => {
    const onPrefetch = jest.fn();
    const wrapper = mount(
      <Router
        basePath="/basepath"
        history={history}
        onPrefetch={onPrefetch}
        routes={routes}
      />
    );

    const component = wrapper.find('RouterContainer');

    expect(component).toHaveLength(1);
    expect(component.props()).toMatchObject({
      basePath: '/basepath',
      history,
      onPrefetch,
      routes,
    });
  });

  it('calls history.listen()() on unmount', () => {
    const unlisten = jest.fn();
    jest.spyOn(history, 'listen').mockReturnValue(unlisten);
    const wrapper = mount(<Router history={history} routes={routes} />);

    wrapper.unmount();

    expect(unlisten).toHaveBeenCalledTimes(1);
  });

  describe('when the router is re-mounted by a parent component', () => {
    it('cleans up the original history listener', () => {
      const RemountingParent = ({
        children,
        shouldRemount = false,
      }: {
        children: ReactNode;
        shouldRemount?: boolean;
      }) => {
        if (shouldRemount) {
          return <span>{children}</span>;
        }

        return <div>{children}</div>;
      };

      const listen = jest.spyOn(history, 'listen');
      const unlisten1 = jest.fn();
      const unlisten2 = jest.fn();

      listen.mockReturnValue(unlisten1);

      const wrapper = mount(
        <RemountingParent>
          <Router history={history} routes={routes} />
        </RemountingParent>
      );

      // first listener is created on mount
      expect(listen).toHaveBeenCalledTimes(1);

      listen.mockReturnValue(unlisten2);

      // trigger the re-mount
      wrapper.setProps({ shouldRemount: true });

      // second listener is created by the RouterContainer on re-mount
      expect(listen).toHaveBeenCalledTimes(2);

      // the original unlistener is called and the new one is not called
      expect(unlisten1).toHaveBeenCalled();
      expect(unlisten2).not.toHaveBeenCalled();
    });
  });

  describe('requestResources()', () => {
    const resolver = (r: any, d = 0) =>
      new Promise(resolve => setTimeout(() => resolve(r), d));

    function createRequestResourceParams() {
      return {
        location: '/path',
        routes: [
          {
            name: '',
            path: '/path',
            component: () => <div>test</div>,
            resources: [
              createResource({
                getData: () => resolver('data-1', 250),
                getKey: () => 'key',
                type: 'TYPE_1',
              }),
              createResource({
                getData: () => resolver('data-2', 500),
                getKey: () => 'key',
                type: 'TYPE_2',
              }),
            ],
          },
        ],
      };
    }

    it('should be expose as a static method', () => {
      expect(typeof Router.requestResources).toBe('function');
    });

    it('should return hydratable, cleaned resource store state.data when awaited', async () => {
      const data = await Router.requestResources(createRequestResourceParams());

      expect(data).toEqual({
        TYPE_1: {
          key: {
            accessedAt: null,
            data: 'data-1',
            error: null,
            expiresAt: null,
            loading: false,
            promise: null,
          },
        },
        TYPE_2: {
          key: {
            accessedAt: null,
            data: 'data-2',
            error: null,
            expiresAt: null,
            loading: false,
            promise: null,
          },
        },
      });
    });

    it('should respect timeout when fetching resources', async () => {
      const data = await Router.requestResources({
        ...createRequestResourceParams(),
        timeout: 350,
      });

      expect(data).toEqual({
        TYPE_1: {
          key: {
            accessedAt: null,
            expiresAt: null,
            data: 'data-1',
            error: null,
            loading: false,
            promise: null,
          },
        },
        TYPE_2: {
          key: {
            accessedAt: null,
            expiresAt: null,
            data: null,
            error: {
              message: 'Resource timed out: TYPE_2',
              name: 'TimeoutError',
              stack: expect.any(String),
            },
            loading: true,
            promise: null,
          },
        },
      });
    });

    it('should maintain the pre-requested state in the resource store when mounted', async () => {
      await Router.requestResources(createRequestResourceParams());

      mount(<Router history={history} routes={[]} />);

      expect(getResourceStore().actions.getSafeData()).toEqual({
        TYPE_1: {
          key: {
            accessedAt: null,
            expiresAt: null,
            data: 'data-1',
            error: null,
            loading: false,
            promise: null,
          },
        },
        TYPE_2: {
          key: {
            accessedAt: null,
            expiresAt: null,
            data: 'data-2',
            error: null,
            loading: false,
            promise: null,
          },
        },
      });
    });

    it('should not re-request resources when they have already been requested by requestResources on the server', async () => {
      jest
        .spyOn(isServerEnvironment, 'isServerEnvironment')
        .mockReturnValue(true);

      const params = createRequestResourceParams();
      const route = params.routes[0];
      const resources = route.resources.map(resource =>
        jest.spyOn(resource, 'getData')
      );

      await Router.requestResources(params);

      mount(
        <Router
          history={createMemoryHistory({ initialEntries: [route.path] })}
          routes={[route]}
        />
      );

      for (const resource of resources) {
        expect(resource).toHaveBeenCalledTimes(1);
      }
    });
  });

  describe('loadRoute', () => {
    describe('should support resources as requestResources', () => {
      const resolver = (r: any, d = 0) =>
        new Promise(resolve => setTimeout(() => resolve(r), d));

      function createRequestResourceParams({ timeout }: { timeout?: number }) {
        const resourcesPlugin = createResourcesPlugin({
          context: {},
          resourceData: null,
          timeout,
        });

        return {
          history: createMemoryHistory({ initialEntries: ['/path'] }),
          routes: [
            {
              name: '',
              path: '/path',
              component: () => <div>test</div>,
              resources: [
                createResource({
                  getData: () => resolver('data-1', 250),
                  getKey: () => 'key',
                  type: 'TYPE_1',
                }),
                createResource({
                  getData: () => resolver('data-2', 500),
                  getKey: () => 'key',
                  type: 'TYPE_2',
                }),
              ],
            },
          ],
          plugins: [resourcesPlugin],
        };
      }

      it('should be expose as a static method', () => {
        expect(typeof Router.loadRoute).toBe('function');
      });

      it('should return hydratable, cleaned resource store state.data when awaited', async () => {
        await Router.loadRoute(createRequestResourceParams({})).resources;

        const data = getResourceStore().actions.getSafeData();

        expect(data).toEqual({
          TYPE_1: {
            key: {
              accessedAt: null,
              data: 'data-1',
              error: null,
              expiresAt: null,
              loading: false,
              promise: null,
            },
          },
          TYPE_2: {
            key: {
              accessedAt: null,
              data: 'data-2',
              error: null,
              expiresAt: null,
              loading: false,
              promise: null,
            },
          },
        });
      });

      it('should respect timeout when fetching resources', async () => {
        await Router.loadRoute({
          ...createRequestResourceParams({ timeout: 350 }),
        }).resources;

        const data = getResourceStore().actions.getSafeData();

        expect(data).toEqual({
          TYPE_1: {
            key: {
              accessedAt: null,
              expiresAt: null,
              data: 'data-1',
              error: null,
              loading: false,
              promise: null,
            },
          },
          TYPE_2: {
            key: {
              accessedAt: null,
              expiresAt: null,
              data: null,
              error: {
                message: 'Resource timed out: TYPE_2',
                name: 'TimeoutError',
                stack: expect.any(String),
              },
              loading: true,
              promise: null,
            },
          },
        });
      });

      it('should maintain the pre-requested state in the resource store when mounted', async () => {
        const route = Router.loadRoute(createRequestResourceParams({}));

        await route.resources;

        mount(<Router history={history} routes={[]} />);

        expect(getResourceStore().actions.getSafeData()).toEqual({
          TYPE_1: {
            key: {
              accessedAt: null,
              expiresAt: null,
              data: 'data-1',
              error: null,
              loading: false,
              promise: null,
            },
          },
          TYPE_2: {
            key: {
              accessedAt: null,
              expiresAt: null,
              data: 'data-2',
              error: null,
              loading: false,
              promise: null,
            },
          },
        });
      });

      it('should not re-request resources when they have already been requested by requestResources on the server', async () => {
        jest
          .spyOn(isServerEnvironment, 'isServerEnvironment')
          .mockReturnValue(true);

        const params = createRequestResourceParams({});
        const route = params.routes[0];
        const resources = route.resources.map(resource =>
          jest.spyOn(resource, 'getData')
        );

        const r = Router.loadRoute(params);

        await r.resources;

        mount(
          <Router
            history={createMemoryHistory({ initialEntries: [route.path] })}
            routes={[route]}
          />
        );

        for (const resource of resources) {
          expect(resource).toHaveBeenCalledTimes(1);
        }
      });
    });
  });
});
