import {
  routeHasChanged,
  routeHasResources,
} from '../../../../../../controllers/resource-store/utils/route-checks';

describe('routeHasChanged()', () => {
  it('should return true if the route objects do not match', () => {
    expect(
      routeHasChanged(
        // @ts-ignore - not providing all properties on mock
        {
          path: '/some-path',
          component: () => null,
        },
        {
          path: '/another-path',
          component: () => null,
        },
      ),
    ).toBeTruthy();
  });

  it('should return true if the prev route is null', () => {
    expect(
      routeHasChanged(
        null,
        // @ts-ignore - not providing all properties on mock
        {
          path: '/another-path',
          component: () => null,
        },
      ),
    ).toBeTruthy();
  });

  it('should return false if the routes match', () => {
    const route = {
      path: '/some-path',
      component: () => null,
    };
    // @ts-ignore - not providing all properties on mock
    expect(routeHasChanged(route, route)).toBeFalsy();
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
