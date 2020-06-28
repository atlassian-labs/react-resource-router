import React from 'react';

import { mount } from 'enzyme';
import * as historyHelper from 'history';
import { mockRoute } from '../../../../common/mocks';
import { UniversalRouter as Router } from '../../../../controllers/universal-router';
import { RouterSubscriber } from '../../../../controllers/subscribers/route';
import { getResourceStore } from '../../../../controllers/resource-store';
import { isServerEnvironment } from '../../../../common/utils';

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
};
const expiresAt = null;
const unlistenMock = jest.fn();
const routes: any[] = [];

jest.mock('../../../../common/utils', () => ({
  ...jest.requireActual<any>('../../../../common/utils'),
  isServerEnvironment: jest.fn(),
}));

describe('UniversalRouter', () => {
  describe('Browser environment', () => {
    beforeEach(() => {
      (isServerEnvironment as any).mockImplementation(() => false);
      mockHistory.listen.mockReturnValue(unlistenMock);
    });

    afterEach(() => {
      jest.resetAllMocks();
    });

    it('renders a RouterContainer', () => {
      const wrapper = mount(
        // @ts-ignore
        <Router history={mockHistory} routes={routes}>
          <div>hello</div>
        </Router>
      );

      const component = wrapper.find('UniversalRouterContainer');

      expect(component).toHaveLength(1);

      expect(component.props()).toEqual(
        expect.objectContaining({
          history: mockHistory,
          routes,
        })
      );
    });

    it('should call the history unlistener on unmount', () => {
      const wrapper = mount(
        // @ts-ignore
        <Router history={mockHistory} routes={routes}>
          <div>hello</div>
        </Router>
      );

      wrapper.unmount();

      expect(unlistenMock).toHaveBeenCalledTimes(1);
    });

    describe('when the router is re-mounted by a parent component', () => {
      it('should clean up the original history listener', () => {
        // @ts-ignore
        const RemountingParent = ({ shouldRemount = false, children }) => {
          if (shouldRemount) {
            return <>{children}</>;
          }

          return <div>{children}</div>;
        };
        const newUnlistener = jest.fn();
        const router = (
          // @ts-ignore
          <Router history={mockHistory} routes={routes}>
            <div>hello</div>
          </Router>
        );
        const wrapper = mount(<RemountingParent>{router}</RemountingParent>);

        // first listener is created on mount
        expect(mockHistory.listen).toHaveBeenCalledTimes(1);

        mockHistory.listen.mockReturnValue(newUnlistener);

        // trigger the re-mount
        wrapper.setProps({ shouldRemount: true });

        // second listener is created by the RouterContainer on re-mount
        expect(mockHistory.listen).toHaveBeenCalledTimes(2);

        // the original unlistener is called and the new one is not called
        expect(unlistenMock).toHaveBeenCalledTimes(1);
        expect(newUnlistener).toHaveBeenCalledTimes(0);
      });
    });
  });

  describe('Server environment', () => {
    beforeEach(() => {
      jest
        .spyOn(historyHelper, 'createMemoryHistory')
        // @ts-ignore
        .mockImplementation(() => mockHistory);
      mockHistory.listen.mockReturnValue(unlistenMock);
    });

    afterEach(() => {
      jest.resetAllMocks();
      jest.restoreAllMocks();
    });

    it('should listen to memory history if no history provided', () => {
      mount(
        <Router routes={[]} isGlobal={false}>
          <RouterSubscriber>
            {() => <div>I am a subscriber</div>}
          </RouterSubscriber>
        </Router>
      );

      expect(mockHistory.listen).toHaveBeenCalled();
    });

    describe('static requestResources', () => {
      const type = 'type';
      const key = 'key';
      const result = 'result';
      const resolver = (r: any, d = 0) =>
        new Promise(resolve => setTimeout(() => resolve(r), d));
      const getDataPromise = Promise.resolve(result);
      const mockResource = {
        type,
        getKey: () => key,
        getData: () => getDataPromise,
      };
      const mockedRoutes = [
        {
          ...mockRoute,
          path: mockLocation.pathname,
          component: () => <div>foo</div>,
          resources: [
            {
              ...mockResource,
              ...{ type: 'HI', getData: () => resolver('hello world', 250) },
            },
            {
              ...mockResource,
              ...{
                type: 'BYE',
                getData: () => resolver('goodbye cruel world', 500),
              },
            },
          ],
        },
      ];

      it('should expose a static requestResources method', () => {
        expect(typeof Router.requestResources).toBe('function');
      });

      it('should return hydratable, cleaned resource store state.data when awaited', async () => {
        const data = await Router.requestResources({
          // @ts-ignore
          routes: mockedRoutes,
        });

        expect(data).toEqual({
          BYE: {
            key: {
              data: 'goodbye cruel world',
              error: null,
              loading: false,
              promise: null,
              expiresAt,
            },
          },
          HI: {
            key: {
              data: 'hello world',
              error: null,
              loading: false,
              promise: null,
              expiresAt,
            },
          },
        });
      });

      it('should maintain the pre-requested state in the resource store when mounted', async () => {
        await Router.requestResources({
          // @ts-ignore
          routes: mockedRoutes,
          location: '/',
        });

        const resourceData = {
          BYE: {
            key: {
              data: 'goodbye cruel world',
              error: null,
              loading: false,
              promise: null,
              expiresAt,
            },
          },
          HI: {
            key: {
              data: 'hello world',
              error: null,
              loading: false,
              promise: null,
              expiresAt,
            },
          },
        };

        mount(
          <Router routes={[]} isGlobal={false}>
            <RouterSubscriber>
              {() => <div>I am a subscriber</div>}
            </RouterSubscriber>
          </Router>
        );

        expect(getResourceStore().actions.getSafeData()).toEqual(resourceData);
      });

      it('should not re-request resources on mount if resources have already been requested by requestResources', async () => {
        const { pathname: location } = mockLocation;
        const resourceSpy1 = jest.spyOn(
          mockedRoutes[0].resources[0],
          'getData'
        );
        const resourceSpy2 = jest.spyOn(
          mockedRoutes[0].resources[1],
          'getData'
        );

        await Router.requestResources({
          // @ts-ignore
          routes: mockedRoutes,
          location,
        });

        mount(
          <Router location={location} routes={[]} isGlobal={false}>
            <RouterSubscriber>
              {() => <div>I am a subscriber</div>}
            </RouterSubscriber>
          </Router>
        );

        expect(resourceSpy1).toHaveBeenCalledTimes(1);
        expect(resourceSpy2).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Memory environment', () => {
    it('should register an instance of memory history in the router store when mounted with a location set', () => {
      let memoryHistory;

      mount(
        <Router routes={[]} location={'/'} isGlobal={false}>
          <RouterSubscriber>
            {
              /* @ts-ignore */
              ({ history }) => {
                memoryHistory = history;

                return null;
              }
            }
          </RouterSubscriber>
        </Router>
      );

      expect(memoryHistory).toHaveProperty('canGo');
    });
  });
});
