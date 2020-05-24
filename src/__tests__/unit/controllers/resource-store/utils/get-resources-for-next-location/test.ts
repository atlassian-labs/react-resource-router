import { getResourcesForNextLocation } from '../../../../../../controllers/resource-store/utils/get-resources-for-next-location';
import { createResource } from '../../../../../../controllers/resource-utils';

const type = 'mockResourceType';
const result = 'some result';
const getDataPromise = Promise.resolve(result);

const mockRoute = {
  name: '',
  path: '',
  component: () => null,
  resources: [],
};
const mockMatch = {
  params: {},
  query: {},
  isExact: false,
  path: '',
  url: '',
};
const mockRouterStoreContext = {
  route: mockRoute,
  match: mockMatch,
  query: {},
  location: { pathname: '', search: '', hash: '' },
};

const mockResource = createResource({
  type,
  getKey: ({ match }: { match: any }) =>
    (match.params && match.params.key) || '',
  getData: () => getDataPromise,
});

const mockResourceStoreContext = {
  mock: 'context',
};

describe('getResourcesForNextLocation()', () => {
  describe('when the next route has no resources', () => {
    it('should return an empty array', () => {
      const prevRoute = {
        path: '/prev-route',
        resources: [mockResource],
      };

      const prevRouterStoreContext = {
        ...mockRouterStoreContext,
        route: prevRoute,
      };
      const nextRouterStoreContext = {
        ...mockRouterStoreContext,
        route: {
          path: '/next-route',
          resources: [],
        },
      };

      const nextResources = getResourcesForNextLocation(
        // @ts-ignore - not providing all route properties on mocks
        prevRouterStoreContext,
        nextRouterStoreContext,
        mockResourceStoreContext,
      );

      expect(nextResources).toEqual([]);
    });
  });

  describe('when the next route does not match the prev route', () => {
    it('should request all resources on the next route', async () => {
      const prevRoute = {
        path: '/prev-route',
        resources: [mockResource],
      };
      const nextRoute = {
        path: '/next-route',
        resources: [
          mockResource,
          { ...mockResource, type: 'another-resource' },
          { ...mockResource, type: 'even-more-resource' },
        ],
      };
      const prevRouterStoreContext = {
        ...mockRouterStoreContext,
        route: prevRoute,
      };
      const nextRouterStoreContext = {
        ...mockRouterStoreContext,
        route: nextRoute,
      };

      const nextResources = getResourcesForNextLocation(
        // @ts-ignore not providing all route properties on mocks
        prevRouterStoreContext,
        nextRouterStoreContext,
        mockResourceStoreContext,
      );

      expect(nextResources).toEqual(nextRoute.resources);
    });
  });

  describe('when the next route is the same as the prev route', () => {
    it('should return all resources that will change between the next match and the prev match', async () => {
      const resourcesThatWillChange = [
        mockResource,
        { ...mockResource, type: 'another-resource' },
        { ...mockResource, type: 'even-more-resource' },
      ];
      const mockRoute = {
        path: '/my-cool-path',
        resources: [
          ...resourcesThatWillChange,
          {
            ...mockResource,
            type: 'an-unchanging-resource',
            getKey: () => 'no-change',
          },
        ],
      };
      const prevRouterStoreContext = {
        ...mockRouterStoreContext,
        route: mockRoute,
        match: { ...mockMatch, params: { key: 'one' } },
      };
      const nextRouterStoreContext = {
        ...mockRouterStoreContext,
        route: mockRoute,
        match: { ...mockMatch, params: { key: 'two' } },
      };

      const nextResources = getResourcesForNextLocation(
        // @ts-ignore not providing all route properties on mocks
        prevRouterStoreContext,
        nextRouterStoreContext,
        mockResourceStoreContext,
      );

      expect(nextResources).toEqual(resourcesThatWillChange);
    });
  });
});
