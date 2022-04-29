import React from 'react';
import { mount } from 'enzyme';

import { mockRoute } from '../../../../common/mocks';
import { isServerEnvironment } from '../../../../common/utils/is-server-environment';
import { RouterSubscriber } from '../../../../controllers/subscribers/route';
import { getResourceStore } from '../../../../controllers/resource-store';
import { Router } from '../../../../controllers/router';

jest.mock('../../../../common/utils/is-server-environment');

const mockLocation = {
  pathname: 'pathname',
  search: 'search',
  hash: 'hash',
};

const HistoryMock: any = {
  push: jest.fn(),
  replace: jest.fn(),
  goBack: jest.fn(),
  goForward: jest.fn(),
  registerBlock: jest.fn(),
  listen: jest.fn(),
  createHref: jest.fn(),
  location: mockLocation,
  _history: jest.fn(),
};

const unlistenMock = jest.fn();

const routes: any[] = [];

describe('<Router />', () => {
  beforeEach(() => {
    HistoryMock.listen.mockReturnValue(unlistenMock);
    (isServerEnvironment as any).mockReturnValue(false);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders a RouterContainer', () => {
    const wrapper = mount(
      <Router history={HistoryMock} routes={routes}>
        <div>hello</div>
      </Router>
    );

    const component = wrapper.find('RouterContainer');

    expect(component).toHaveLength(1);

    expect(component.props()).toEqual(
      expect.objectContaining({
        history: HistoryMock,
        routes,
      })
    );
  });

  it('should call the history unlistener on unmount', () => {
    const wrapper = mount(
      <Router history={HistoryMock} routes={routes}>
        <div>hello</div>
      </Router>
    );

    wrapper.unmount();

    expect(unlistenMock).toHaveBeenCalled();
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
        <Router history={HistoryMock} routes={routes}>
          <div>hello</div>
        </Router>
      );
      const wrapper = mount(<RemountingParent>{router}</RemountingParent>);

      // first listener is created on mount
      expect(HistoryMock.listen).toHaveBeenCalledTimes(1);

      HistoryMock.listen.mockReturnValue(newUnlistener);

      // trigger the re-mount
      wrapper.setProps({ shouldRemount: true });

      // second listener is created by the RouterContainer on re-mount
      expect(HistoryMock.listen).toHaveBeenCalledTimes(2);

      // the original unlistener is called and the new one is not called
      expect(unlistenMock).toHaveBeenCalled();
      expect(newUnlistener).not.toHaveBeenCalled();
    });
  });

  describe('static requestResources', () => {
    const type = 'type';
    const key = 'key';
    const result = 'result';
    const resolver = (r: any, d = 0) =>
      new Promise(resolve => setTimeout(() => resolve(r), d));
    const getDataPromise = Promise.resolve(result);
    const mockResource: any = {
      type,
      getKey: () => key,
      getData: () => getDataPromise,
    };
    const expiresAt = null;

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
        location: mockLocation.pathname,
        routes: mockedRoutes,
      });

      expect(data).toEqual({
        BYE: {
          key: {
            data: 'goodbye cruel world',
            error: null,
            loading: false,
            promise: null,
            accessedAt: null,
            expiresAt,
          },
        },
        HI: {
          key: {
            data: 'hello world',
            error: null,
            loading: false,
            promise: null,
            accessedAt: null,
            expiresAt,
          },
        },
      });
    });

    it('should respect timeout when fetching resources', async () => {
      const data = await Router.requestResources({
        routes: mockedRoutes,
        location: mockLocation.pathname,
        timeout: 350,
      });

      expect(data).toEqual({
        BYE: {
          key: {
            data: null,
            error: {
              message: 'Resource timed out: BYE',
              name: 'TimeoutError',
              stack: expect.any(String),
            },
            loading: true,
            promise: null,
            accessedAt: null,
            expiresAt,
          },
        },
        HI: {
          key: {
            data: 'hello world',
            error: null,
            loading: false,
            promise: null,
            accessedAt: null,
            expiresAt,
          },
        },
      });
    });

    it('should maintain the pre-requested state in the resource store when mounted', async () => {
      await Router.requestResources({
        routes: mockedRoutes,
        location: mockLocation.pathname,
      });

      const resourceData = {
        BYE: {
          key: {
            data: 'goodbye cruel world',
            error: null,
            loading: false,
            promise: null,
            accessedAt: null,
            expiresAt,
          },
        },
        HI: {
          key: {
            data: 'hello world',
            error: null,
            loading: false,
            promise: null,
            accessedAt: null,
            expiresAt,
          },
        },
      };

      mount(
        <Router history={HistoryMock} routes={[]}>
          <RouterSubscriber>
            {() => <div>I am a subscriber</div>}
          </RouterSubscriber>
        </Router>
      );

      expect(getResourceStore().actions.getSafeData()).toEqual(resourceData);
    });

    it('should not re-request resources on mount if resources have already been requested by requestResources', async () => {
      const resourceSpy1 = jest.spyOn(mockedRoutes[0].resources[0], 'getData');
      const resourceSpy2 = jest.spyOn(mockedRoutes[0].resources[1], 'getData');

      await Router.requestResources({
        routes: mockedRoutes,
        location: mockLocation.pathname,
      });

      mount(
        <Router location={mockLocation.pathname} routes={[]}>
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
