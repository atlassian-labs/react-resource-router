import { mount } from 'enzyme';
import * as history4 from 'history';
import * as history5 from 'history-5';
import React from 'react';
import { defaultRegistry } from 'react-sweet-state';

import { combine } from '../../common/utils/combine';
import * as isServerEnvironment from '../../common/utils/is-server-environment';
import { createResourcesLoader } from '../../resources/loader';
import { getResourceStore } from '../resource-store';

import { ContainerProps } from './types';

import {
  createRouterSelector,
  getRouterState,
  getRouterStore,
  INITIAL_STATE,
  RouterContainer,
} from './index';

const createCombinedLoader = ({
  context,
  resourceData,
}: {
  context: any;
  resourceData: any;
}) => {
  const resources = createResourcesLoader({
    context,
    resourceData,
  });

  return combine(resources);
};

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

      const loader = createCombinedLoader({
        context: props.resourceContext,
        resourceData: props.resourceData,
      });

      mount(
        <RouterContainer
          history={history}
          isGlobal
          loader={loader}
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
        loader,
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
        const { history, getState, loader } = renderRouterContainer({
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
          loader,
        });
      });

      it('hydrates the resource store with the provided data', () => {
        const hydrate = jest.spyOn(getResourceStore().actions, 'hydrate');
        const resourceContext = { context: 'test' };
        const resourceData = {
          type: {
            key: {
              accessedAt: 0,
              data: 'data',
              error: null,
              expiresAt: 0,
              loading: false,
              promise: Promise.resolve('data'),
            },
          },
        };

        renderRouterContainer({
          resourceContext,
          resourceData,
        });

        expect(hydrate).toBeCalledWith({
          resourceContext,
          resourceData,
        });
      });

      it('requests route resources', () => {
        const requestAllResources = jest.spyOn(
          getResourceStore().actions,
          'requestAllResources'
        );

        const { getState } = renderRouterContainer();

        const { route, match, query } = getState();

        expect(requestAllResources).toBeCalledTimes(1);
        expect(requestAllResources).toBeCalledWith(
          {
            route,
            match,
            query,
          },
          {
            timeout: undefined,
          }
        );
      });
    });

    describe('push()', () => {
      describe.each([undefined, '/base-path'])('with %s basePath', basePath => {
        it('pushes a relative path given a relative path', async () => {
          const { actions, getState, history } = renderRouterContainer({
            basePath,
          });

          actions.push('/pages/1');

          expect(history.push).toBeCalledWith(`${basePath ?? ''}/pages/1`);
          expect(getState()).toMatchObject({
            action: 'PUSH',
            route: routes[1],
          });
        });

        if (!basePath) {
          it('pushes a relative path given an absolute URL on the same domain', async () => {
            const { actions, getState, history } = renderRouterContainer();

            actions.push(`http://localhost:3000${basePath ?? ''}/pages/1`);

            expect(history.push).toBeCalledWith(`${basePath ?? ''}/pages/1`);
            expect(getState()).toMatchObject({
              action: 'PUSH',
              route: routes[1],
            });
          });

          it('pushes a relative path given an absolute URL on the same domain', async () => {
            const { actions, getState, history } = renderRouterContainer();

            actions.push(`http://localhost:3000/pages/1`);

            expect(history.push).toBeCalledWith('/pages/1');
            expect(getState()).toMatchObject({
              action: 'PUSH',
              route: routes[1],
            });
          });

          it('pushes a relative Location object given a relative Location object', async () => {
            const { actions, getState, history } = renderRouterContainer();
            const nextLocation = { pathname: '/pages/1', search: '', hash: '' };

            actions.push(nextLocation);

            expect(history.push).toBeCalledWith(nextLocation);
            expect(getState()).toMatchObject({
              action: 'PUSH',
              route: routes[1],
            });
          });
        }
      });

      it('calls location.assign given an absolute URL on a different domain', () => {
        const assign = jest.spyOn(window.location, 'assign');
        const { actions } = renderRouterContainer();

        actions.push('http://example.com');

        expect(assign).toBeCalledWith('http://example.com');
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

        const loader = createCombinedLoader({
          context: {},
          resourceData: null,
        });

        const wrapper = mount(
          <RouterContainer
            history={createMemoryHistory()}
            loader={loader}
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

        const loader = createCombinedLoader({
          context: {},
          resourceData: null,
        });

        const wrapper = mount(
          <RouterContainer
            history={createMemoryHistory()}
            loader={loader}
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
