import { qs } from 'url-parse';

import type { Query } from '../../types.tsx';

import { matchRouteCache } from './utils';

import matchRoute from './index';

describe('matchRoute()', () => {
  beforeEach(() => {
    matchRouteCache.cache.clear();
  });

  const Noop = () => null;
  const DEFAULT_ROUTE_NAME = 'default';

  describe('pathname', () => {
    it('should match a pathname without a query string', () => {
      const route1 = {
        path: '/foo',
        exact: false,
        component: Noop,
        name: 'ROUTE_1',
      };
      const route2 = {
        path: '/foo/abc',
        exact: true,
        component: Noop,
        name: 'ROUTE_1',
      };
      expect(matchRoute([route1, route2], '/foo/abc')).toEqual({
        route: route2,
        match: {
          params: {},
          isExact: true,
          path: '/foo/abc',
          query: {},
          url: '/foo/abc',
        },
      });
    });

    it('should match by path specifity', () => {
      const route = {
        path: '/foo/:bar',
        component: Noop,
        name: DEFAULT_ROUTE_NAME,
      };
      expect(matchRoute([route], '/foo/abc')).toEqual({
        route,
        match: {
          params: { bar: 'abc' },
          isExact: true,
          path: '/foo/:bar',
          query: {},
          url: '/foo/abc',
        },
      });

      expect(matchRoute([route], '/baz/abc')).toBeNull();
    });
  });

  describe('pathname with basePath', () => {
    it('should match a pathname when basePath is empty', () => {
      const route = {
        path: '/foo/:bar',
        component: Noop,
        name: DEFAULT_ROUTE_NAME,
      };
      expect(matchRoute([route], '/foo/abc')).toEqual({
        route,
        match: {
          params: { bar: 'abc' },
          isExact: true,
          path: '/foo/:bar',
          query: {},
          url: '/foo/abc',
        },
      });

      expect(matchRoute([route], '/hello/foo/abc')).toBeNull();
      expect(matchRoute([route], '/baz/abc')).toBeNull();
    });

    it('should match a basePath+pathname without a query string', () => {
      const route = {
        path: '/foo/:bar',
        component: Noop,
        name: DEFAULT_ROUTE_NAME,
      };
      const basePath = '/base';
      expect(matchRoute([route], '/base/foo/abc', undefined, basePath)).toEqual(
        {
          route,
          match: {
            params: { bar: 'abc' },
            isExact: true,
            path: '/base/foo/:bar',
            query: {},
            url: '/base/foo/abc',
          },
        }
      );

      expect(matchRoute([route], '/foo/abc', undefined, basePath)).toBeNull();
      expect(
        matchRoute([route], '/base/baz/abc', undefined, basePath)
      ).toBeNull();
    });
  });

  describe('query', () => {
    it('should match query config requiring query name to be present', () => {
      const route = {
        path: '/abc/:bar',
        query: ['foo'],
        component: Noop,
        name: DEFAULT_ROUTE_NAME,
      };
      expect(
        matchRoute(
          [route],
          '/abc/def',
          qs.parse('?foo=baz&spa=awesome') as Query
        )
      ).toMatchObject({
        route,
        match: {
          query: {
            foo: 'baz',
          },
        },
      });

      expect(matchRoute([route], '/abc/def')).toBeNull();
      expect(
        matchRoute([route], '/abc/def', qs.parse('?spa=awesome') as Query)
      ).toBeNull();
    });

    it('should match query config with multiple query params if all of them match', () => {
      const multiple = {
        path: '/abc/:bar',
        query: ['foo', 'spa'],
        component: Noop,
        name: DEFAULT_ROUTE_NAME,
      };
      expect(
        matchRoute(
          [multiple],
          '/abc/def',
          qs.parse('?foo=baz&spa=awesome') as Query
        )
      ).toMatchObject({
        route: multiple,
      });
      expect(
        matchRoute([multiple], '/abc/def', qs.parse('?foo=baz') as Query)
      ).toBeNull();
      expect(
        matchRoute([multiple], '/abc/def', qs.parse('?spa=awesome') as Query)
      ).toBeNull();
    });

    it('should return same match object as matching pathname but with additional query object containing all query params', () => {
      const route = {
        path: '/abc/:bar',
        query: ['foo'],
        component: Noop,
        name: DEFAULT_ROUTE_NAME,
      };

      expect(
        matchRoute(
          [route],
          '/abc/def',
          qs.parse('?foo=baz&spa=awesome') as Query
        )
      ).toEqual({
        route,
        match: {
          params: {
            bar: 'def',
          },
          query: {
            foo: 'baz',
          },
          isExact: true,
          path: '/abc/:bar',
          url: '/abc/def',
        },
      });
    });

    it('should match query config requiring query param to equal specific value', () => {
      const route = {
        path: '/abc/:bar',
        query: ['foo=baz'],
        component: Noop,
        name: DEFAULT_ROUTE_NAME,
      };
      expect(
        matchRoute(
          [route],
          '/abc/def',
          qs.parse('?foo=baz&spa=awesome') as Query
        )
      ).toMatchObject({
        route,
        match: {
          query: {
            foo: 'baz',
          },
        },
      });

      expect(matchRoute([route], '/abc/def')).toBeNull();
      expect(
        matchRoute(
          [route],
          '/abc/def',
          qs.parse('?foo=abc&spa=awesome') as Query
        )
      ).toBeNull();
    });

    it('should match query config requiring query param to equal a regex value', () => {
      const route = {
        path: '/abc/:bar',
        query: ['foo=(plan.*)'],
        component: Noop,
        name: DEFAULT_ROUTE_NAME,
      };
      expect(
        matchRoute(
          [route],
          '/abc/def',
          qs.parse('?foo=plan&spa=awesome') as Query
        )
      ).toMatchObject({
        route,
        match: {
          query: {
            foo: 'plan',
          },
        },
      });
      expect(
        matchRoute(
          [route],
          '/abc/def',
          qs.parse('?foo=planning&spa=awesome') as Query
        )
      ).toMatchObject({
        route,
        match: {
          query: {
            foo: 'planning',
          },
        },
      });

      expect(matchRoute([route], '/abc/def')).toBeNull();

      expect(
        matchRoute([route], '/abc/def', qs.parse('?foo=pla') as Query)
      ).toBeNull();

      const numberRegexRoute = {
        path: '/abc/:bar',
        query: ['spaAwesomeFactor=(\\d)'],
        component: Noop,
        name: DEFAULT_ROUTE_NAME,
      };

      expect(
        matchRoute(
          [numberRegexRoute],
          '/abc/def',
          qs.parse('spaAwesomeFactor=9') as Query
        )
      ).toMatchObject({
        route: numberRegexRoute,
      });
      // Should be only one number
      expect(
        matchRoute(
          [numberRegexRoute],
          '/abc/def',
          qs.parse('spaAwesomeFactor=10') as Query
        )
      ).toBeNull();
      // Should be a number
      expect(
        matchRoute(
          [numberRegexRoute],
          '/abc/def',
          qs.parse('spaAwesomeFactor=abc') as Query
        )
      ).toBeNull();
    });

    it('should match query params literally instead of as a regex when value does not start with parentheses', () => {
      const route = {
        path: '/abc/:bar',
        query: ['foo=plan.detail'],
        component: Noop,
        name: DEFAULT_ROUTE_NAME,
      };
      expect(
        matchRoute([route], '/abc/def', qs.parse('?foo=plan.detail') as Query)
      ).toMatchObject({
        route,
        match: {
          query: {
            foo: 'plan.detail',
          },
        },
      });
      expect(
        matchRoute([route], '/abc/def', qs.parse('?foo=plansdetail') as Query)
      ).toBeNull();
    });

    it('should match query config requiring query param to not equal a specific value', () => {
      const route = {
        path: '/abc/:bar',
        query: ['foo!=bar'],
        component: Noop,
        name: DEFAULT_ROUTE_NAME,
      };
      expect(
        matchRoute(
          [route],
          '/abc/def',
          qs.parse('?foo=baz&spa=awesome') as Query
        )
      ).toMatchObject({
        route,
        match: {
          query: {
            foo: 'baz',
          },
        },
      });
      expect(
        matchRoute([route], '/abc/def', qs.parse('?spa=awesome') as Query)
      ).toMatchObject({
        route,
        match: {
          query: {},
        },
      });

      expect(
        matchRoute([route], '/abc/def', qs.parse('?foo=bar') as Query)
      ).toBeNull();
    });

    it('should match query config requiring alternative params', () => {
      const route = {
        path: '/abc/:bar',
        query: ['foo|foo2'],
        component: Noop,
        name: DEFAULT_ROUTE_NAME,
      };
      expect(
        matchRoute(
          [route],
          '/abc/def',
          qs.parse('?foo=bar&spa=awesome') as Query
        )
      ).toMatchObject({
        route,
        match: {
          query: {
            foo: 'bar',
          },
        },
      });

      expect(
        matchRoute([route], '/abc/def', qs.parse('?foo2=1') as Query)
      ).toMatchObject({
        route,
        match: {
          query: {
            foo2: '1',
          },
        },
      });
      expect(
        matchRoute([route], '/abc/def', qs.parse('?foo=bar&foo2=1') as Query)
      ).toMatchObject({
        route,
        match: {
          query: {
            foo: 'bar',
            foo2: '1',
          },
        },
      });

      expect(
        matchRoute([route], '/abc/def', qs.parse('?spa=awesome') as Query)
      ).toBeNull();
    });

    it('should match query config including optional params', () => {
      const route = {
        path: '/abc/:bar',
        query: ['foo', 'baz?', 'bar?=(\\d+)'],
        component: Noop,
        name: DEFAULT_ROUTE_NAME,
      };

      expect(
        matchRoute([route], '/abc/def', qs.parse('?foo') as Query)
      ).toMatchObject({
        route,
        match: {
          query: {
            foo: '',
          },
        },
      });
      expect(
        matchRoute([route], '/abc/def', qs.parse('?foo&baz=cool') as Query)
      ).toMatchObject({
        route,
        match: {
          query: {
            foo: '',
            baz: 'cool',
          },
        },
      });
      expect(
        matchRoute(
          [route],
          '/abc/def',
          qs.parse('?foo&bar=1&baz=cool') as Query
        )
      ).toMatchObject({
        route,
        match: {
          query: {
            foo: '',
            bar: '1',
            baz: 'cool',
          },
        },
      });
      expect(
        matchRoute(
          [route],
          '/abc/def',
          qs.parse('?foo&baz=cool&bar=cool') as Query
        )
      ).toBeNull();
    });

    it('should fail gracefully if passed invalid query string', () => {
      const route = {
        path: '/abc/:bar',
        query: ['foo'],
        component: Noop,
        name: DEFAULT_ROUTE_NAME,
      };
      expect(
        matchRoute([route], '/abc/def', qs.parse('?badstring=%') as Query)
      ).toBeNull();

      expect(
        matchRoute([route], '/abc/def', qs.parse('?foo=%') as Query)
      ).toBeNull();

      expect(
        matchRoute([route], '/abc/def', qs.parse('?foo=%2') as Query)
      ).toBeNull();
    });

    it('should handle non-standard characters', () => {
      const route = {
        path: '/abc/:bar',
        query: ['foo', 'bar?'],
        component: Noop,
        name: DEFAULT_ROUTE_NAME,
      };
      expect(
        matchRoute([route], '/abc/def', qs.parse('?foo=a%0Ab&bar=3') as Query) // %0A == line feed
      ).toMatchObject({
        route,
        match: {
          query: {
            foo: 'a\nb',
            bar: '3',
          },
        },
      });

      expect(
        matchRoute([route], '/abc/def', qs.parse('?foo=a%00b&bar=3') as Query) // %00 == null
      ).toMatchObject({
        route,
        match: {
          query: {
            foo: 'a\0b',
            bar: '3',
          },
        },
      });

      expect(
        matchRoute([route], '/abc/def', qs.parse('?foo=prøve&bar=3') as Query) // ø is non-ascii character
      ).toMatchObject({
        route,
        match: {
          query: {
            foo: 'prøve',
            bar: '3',
          },
        },
      });
    });
  });
});
