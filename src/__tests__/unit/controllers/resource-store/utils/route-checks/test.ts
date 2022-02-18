import {
  routeHasChanged,
  routeHasResources,
} from '../../../../../../controllers/resource-store/utils/route-checks';

const mockRoute = {
  name: 'foo',
  path: '/some-path',
  component: () => null,
};

describe('routeHasChanged()', () => {
  it('should return true if the route name does not match', () => {
    expect(
      routeHasChanged(mockRoute, {
        ...mockRoute,
        name: 'bar',
      })
    ).toBeTruthy();
  });

  it('should return true if the route path does not match', () => {
    expect(
      routeHasChanged(mockRoute, {
        ...mockRoute,
        path: '/bar',
      })
    ).toBeTruthy();
  });

  it('should return false if the route name matches', () => {
    expect(routeHasChanged(mockRoute, { ...mockRoute })).toBeFalsy();
  });
});

describe('routeHasResources()', () => {
  it('should return true if the route has one or more resources', () => {
    const route = {
      path: '/some-path',
      component: () => null,
      resources: [{ mock: 'resource' }],
    };
    // @ts-ignore - not providing all properties on mock
    expect(routeHasResources(route)).toBeTruthy();
  });

  it('should return false if the route does not exist', () => {
    const route = null;
    expect(routeHasResources(route)).toBeFalsy();
  });

  it('should return false if the route has no resources', () => {
    const route = {
      path: '/some-path',
      component: () => null,
      resources: [],
    };
    // @ts-ignore - not providing all properties on mock
    expect(routeHasResources(route)).toBeFalsy();
  });

  it('should return false if the route does not have a resources property', () => {
    const route = {
      path: '/some-path',
      component: () => null,
    };
    // @ts-ignore - not providing all properties on mock
    expect(routeHasResources(route)).toBeFalsy();
  });
});
