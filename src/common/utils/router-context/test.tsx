import React from 'react';

import { DEFAULT_MATCH, DEFAULT_ROUTE } from '../../../common/constants';
import { createRouterContext, findRouterContext } from './index';

const mockComponent = () => <div>I am a route</div>;

const mockRoutes = [
  { path: '/foo', component: mockComponent, name: 'foo' },
  { path: '/boo', component: mockComponent, name: 'boo' },
  { path: '/baz', component: mockComponent, name: 'baz' },
];

const mockLocation = {
  pathname: '/baz',
  search: '?iam=cool',
  hash: '',
};

describe('Router findRouterContext util', () => {
  it('should return the route match', () => {
    const context = findRouterContext(mockRoutes, { location: mockLocation });

    expect(context).toEqual({
      route: mockRoutes[2],
      match: expect.objectContaining({
        isExact: true,
        path: mockRoutes[2].path,
        url: mockRoutes[2].path,
      }),
      query: { iam: 'cool' },
    });
  });

  it('should return an empty context when the location does not match a route', () => {
    const unknownLocation = {
      ...mockLocation,
      pathname: '/unknown',
    };

    const context = findRouterContext(mockRoutes, {
      location: unknownLocation,
    });

    expect(context).toEqual({
      route: DEFAULT_ROUTE,
      match: DEFAULT_MATCH,
      query: { iam: 'cool' },
    });
  });
});

describe('Router createRouterContext util', () => {
  it('should return the context for provided route', () => {
    const route = {
      path: '/foo/:page',
      component: mockComponent,
      name: 'foo',
    };
    const context = createRouterContext(route, { params: { page: 'cool' } });

    expect(context).toEqual({
      route,
      match: expect.objectContaining({
        params: { page: 'cool' },
        query: {},
        url: '/foo/cool',
      }),
      query: {},
    });
  });

  it('should return the context for provided route with query', () => {
    const route = {
      path: '/foo',
      query: ['order'],
      component: mockComponent,
      name: 'foo',
    };
    const context = createRouterContext(route, {
      query: { order: '1', iam: 'cool' },
    });

    expect(context).toEqual({
      route,
      match: expect.objectContaining({
        params: {},
        query: { order: '1' },
        url: '/foo',
      }),
      query: { order: '1', iam: 'cool' },
    });
  });
});
