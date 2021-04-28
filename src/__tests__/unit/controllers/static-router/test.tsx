import React from 'react';

import { mount } from 'enzyme';
import * as historyHelper from 'history';
import { defaultRegistry } from 'react-sweet-state';

import { mockRoute } from '../../../../common/mocks';
import { getResourceStore } from '../../../../controllers/resource-store';
import { StaticRouter } from '../../../../controllers/static-router';
import { RouterSubscriber } from '../../../../controllers/subscribers/route';

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

describe('<StaticRouter />', () => {
  afterEach(() => {
    defaultRegistry.stores.clear();
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });
  beforeEach(() => {
    jest
      .spyOn(historyHelper, 'createMemoryHistory')
      // @ts-ignore
      .mockImplementation(() => mockHistory);
  });

  it('should not respond to history changes', () => {
    mount(
      <StaticRouter routes={[]}>
        <RouterSubscriber>
          {() => <div>I am a subscriber</div>}
        </RouterSubscriber>
      </StaticRouter>
    );

    expect(mockHistory.listen).not.toHaveBeenCalled();
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
      expect(typeof StaticRouter.requestResources).toBe('function');
    });

    it('should return hydratable, cleaned resource store state.data when awaited', async () => {
      const data = await StaticRouter.requestResources({
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

    it('should respect max wait time when fetching resources', async () => {
      const data = await StaticRouter.requestResources({
        // @ts-ignore
        routes: mockedRoutes,
        location: '/',
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
      await StaticRouter.requestResources({
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
        <StaticRouter routes={[]}>
          <RouterSubscriber>
            {() => <div>I am a subscriber</div>}
          </RouterSubscriber>
        </StaticRouter>
      );

      expect(getResourceStore().actions.getSafeData()).toEqual(resourceData);
    });

    it('should not re-request resources on mount if resources have already been requested by requestResources', async () => {
      const { pathname: location } = mockLocation;
      const resourceSpy1 = jest.spyOn(mockedRoutes[0].resources[0], 'getData');
      const resourceSpy2 = jest.spyOn(mockedRoutes[0].resources[1], 'getData');

      await StaticRouter.requestResources({
        // @ts-ignore
        routes: mockedRoutes,
        location,
      });

      mount(
        <StaticRouter location={location} routes={[]}>
          <RouterSubscriber>
            {() => <div>I am a subscriber</div>}
          </RouterSubscriber>
        </StaticRouter>
      );

      expect(resourceSpy1).toHaveBeenCalledTimes(1);
      expect(resourceSpy2).toHaveBeenCalledTimes(1);
    });
  });
});
