import { qs } from 'url-parse';

import matchRoute from './index';
import { matchRouteCache } from './utils';

const Noop = () => null;
const DEFAULT_QUERY_PARAMS = {};
const { parse } = qs;

describe('matchRoute()', () => {
  beforeEach(() => {
    matchRouteCache.cache.clear();
  });

  describe('pathname', () => {
    it('should match a pathname without a query string', () => {
      const route = { path: '/foo/:bar', component: Noop };
      // @ts-ignore
      expect(matchRoute([route], '/foo/abc', DEFAULT_QUERY_PARAMS)).toEqual({
        route,
        match: {
          params: { bar: 'abc' },
          isExact: true,
          path: '/foo/:bar',
          query: {},
          url: '/foo/abc',
        },
      });

      // @ts-ignore
      expect(matchRoute([route], '/baz/abc', DEFAULT_QUERY_PARAMS)).toBeNull();
    });

    it('should return the first route that is a match', () => {
      const routeA = { path: '/foo/:bar', component: Noop };
      const routeB = { path: '/foo/:baz', component: Noop };
      expect(
        // @ts-ignore
        matchRoute([routeA, routeB], '/foo/abc', DEFAULT_QUERY_PARAMS)
      ).toMatchObject({
        route: routeA,
      });

      expect(
        // @ts-ignore
        matchRoute([routeB], '/foo/abc', DEFAULT_QUERY_PARAMS)
      ).toMatchObject({
        route: routeB,
      });
    });
  });

  describe('pathname with basePath', () => {
    it('should match a pathname when basePath is empty', () => {
      const route = { path: '/foo/:bar', component: Noop };
      expect(
        // @ts-ignore
        matchRoute([route], '/foo/abc', DEFAULT_QUERY_PARAMS)
      ).toEqual({
        route,
        match: {
          params: { bar: 'abc' },
          isExact: true,
          path: '/foo/:bar',
          query: {},
          url: '/foo/abc',
        },
      });

      expect(
        // @ts-ignore
        matchRoute([route], '/hello/foo/abc', DEFAULT_QUERY_PARAMS)
      ).toBeNull();
      expect(
        // @ts-ignore
        matchRoute([route], '/baz/abc', DEFAULT_QUERY_PARAMS)
      ).toBeNull();
    });

    it('should match a basePath+pathname without a query string', () => {
      const route = { path: '/foo/:bar', component: Noop };
      const basePath = '/base';
      expect(
        // @ts-ignore
        matchRoute([route], '/base/foo/abc', DEFAULT_QUERY_PARAMS, basePath)
      ).toEqual({
        route,
        match: {
          params: { bar: 'abc' },
          isExact: true,
          path: '/base/foo/:bar',
          query: {},
          url: '/base/foo/abc',
        },
      });

      expect(
        // @ts-ignore
        matchRoute([route], '/foo/abc', DEFAULT_QUERY_PARAMS, basePath)
      ).toBeNull();
      expect(
        // @ts-ignore
        matchRoute([route], '/base/baz/abc', DEFAULT_QUERY_PARAMS, basePath)
      ).toBeNull();
    });

    it('should return the first route that is a match', () => {
      const routeA = { path: '/foo/:bar', component: Noop };
      const routeB = { path: '/foo/:baz', component: Noop };
      const basePath = '/base';
      expect(
        matchRoute(
          // @ts-ignore
          [routeA, routeB],
          '/base/foo/abc',
          DEFAULT_QUERY_PARAMS,
          basePath
        )
      ).toMatchObject({
        route: routeA,
      });

      expect(
        // @ts-ignore
        matchRoute([routeB], '/base/foo/abc', DEFAULT_QUERY_PARAMS, basePath)
      ).toMatchObject({
        route: routeB,
      });
    });
  });

  describe('query', () => {
    it('should match query config requiring query name to be present', () => {
      const route = {
        path: '/abc/:bar',
        query: ['foo'],
        component: Noop,
      };
      expect(
        // @ts-ignore
        matchRoute([route], '/abc/def', parse('?foo=baz&spa=awesome'))
      ).toMatchObject({
        route,
        match: {
          query: {
            foo: 'baz',
          },
        },
      });

      // @ts-ignore
      expect(matchRoute([route], '/abc/def', DEFAULT_QUERY_PARAMS)).toBeNull();
      // @ts-ignore
      expect(matchRoute([route], '/abc/def', parse('?spa=awesome'))).toBeNull();
    });

    it('should match query config with multiple query params if all of them match', () => {
      const multiple = {
        path: '/abc/:bar',
        query: ['foo', 'spa'],
        component: Noop,
      };
      expect(
        // @ts-ignore
        matchRoute([multiple], '/abc/def', parse('?foo=baz&spa=awesome'))
      ).toMatchObject({
        route: multiple,
      });
      // @ts-ignore
      expect(matchRoute([multiple], '/abc/def', parse('?foo=baz'))).toBeNull();
      expect(
        // @ts-ignore
        matchRoute([multiple], '/abc/def', parse('?spa=awesome'))
      ).toBeNull();
    });

    it('should return same match object as matching pathname but with additional query object containing all query params', () => {
      const route = {
        path: '/abc/:bar',
        query: ['foo'],
        component: Noop,
      };

      expect(
        // @ts-ignore
        matchRoute([route], '/abc/def', parse('?foo=baz&spa=awesome'))
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
      };
      expect(
        // @ts-ignore
        matchRoute([route], '/abc/def', parse('?foo=baz&spa=awesome'))
      ).toMatchObject({
        route,
        match: {
          query: {
            foo: 'baz',
          },
        },
      });

      // @ts-ignore
      expect(matchRoute([route], '/abc/def', DEFAULT_QUERY_PARAMS)).toBeNull();
      expect(
        // @ts-ignore
        matchRoute([route], '/abc/def', parse('?foo=abc&spa=awesome'))
      ).toBeNull();
    });

    it('should match query config requiring query param to equal a regex value', () => {
      const route = {
        path: '/abc/:bar',
        query: ['foo=(plan.*)'],
        component: Noop,
      };
      expect(
        // @ts-ignore
        matchRoute([route], '/abc/def', parse('?foo=plan&spa=awesome'))
      ).toMatchObject({
        route,
        match: {
          query: {
            foo: 'plan',
          },
        },
      });
      expect(
        // @ts-ignore
        matchRoute([route], '/abc/def', parse('?foo=planning&spa=awesome'))
      ).toMatchObject({
        route,
        match: {
          query: {
            foo: 'planning',
          },
        },
      });
      // @ts-ignore
      expect(matchRoute([route], '/abc/def', DEFAULT_QUERY_PARAMS)).toBeNull();
      // @ts-ignore
      expect(matchRoute([route], '/abc/def', parse('?foo=pla'))).toBeNull();

      const numberRegexRoute = {
        path: '/abc/:bar',
        query: ['spaAwesomeFactor=(\\d)'],
        component: Noop,
      };

      expect(
        // @ts-ignore
        matchRoute([numberRegexRoute], '/abc/def', parse('spaAwesomeFactor=9'))
      ).toMatchObject({
        route: numberRegexRoute,
      });
      // Should be only one number
      expect(
        matchRoute(
          // @ts-ignore
          [numberRegexRoute],
          '/abc/def',
          parse('spaAwesomeFactor=10')
        )
      ).toBeNull();
      // Should be a number
      expect(
        matchRoute(
          // @ts-ignore
          [numberRegexRoute],
          '/abc/def',
          parse('spaAwesomeFactor=abc')
        )
      ).toBeNull();
    });

    it('should match query params literally instead of as a regex when value does not start with parentheses', () => {
      const route = {
        path: '/abc/:bar',
        query: ['foo=plan.detail'],
        component: Noop,
      };
      expect(
        // @ts-ignore
        matchRoute([route], '/abc/def', parse('?foo=plan.detail'))
      ).toMatchObject({
        route,
        match: {
          query: {
            foo: 'plan.detail',
          },
        },
      });
      expect(
        // @ts-ignore
        matchRoute([route], '/abc/def', parse('?foo=plansdetail'))
      ).toBeNull();
    });

    it('should match query config requiring query param to not equal a specific value', () => {
      const route = {
        path: '/abc/:bar',
        query: ['foo!=bar'],
        component: Noop,
      };
      expect(
        // @ts-ignore
        matchRoute([route], '/abc/def', parse('?foo=baz&spa=awesome'))
      ).toMatchObject({
        route,
        match: {
          query: {
            foo: 'baz',
          },
        },
      });
      expect(
        // @ts-ignore
        matchRoute([route], '/abc/def', parse('?spa=awesome'))
      ).toMatchObject({
        route,
        match: {
          query: {},
        },
      });
      // @ts-ignore
      expect(matchRoute([route], '/abc/def', parse('?foo=bar'))).toBeNull();
    });

    it('should match query config requiring alternative params', () => {
      const route = {
        path: '/abc/:bar',
        query: ['foo|foo2'],
        component: Noop,
      };
      expect(
        // @ts-ignore
        matchRoute([route], '/abc/def', parse('?foo=bar&spa=awesome'))
      ).toMatchObject({
        route,
        match: {
          query: {
            foo: 'bar',
          },
        },
      });
      // @ts-ignore
      expect(matchRoute([route], '/abc/def', parse('?foo2=1'))).toMatchObject({
        route,
        match: {
          query: {
            foo2: '1',
          },
        },
      });
      expect(
        // @ts-ignore
        matchRoute([route], '/abc/def', parse('?foo=bar&foo2=1'))
      ).toMatchObject({
        route,
        match: {
          query: {
            foo: 'bar',
            foo2: '1',
          },
        },
      });
      // @ts-ignore
      expect(matchRoute([route], '/abc/def', parse('?spa=awesome'))).toBeNull();
    });

    it('should match query config including optional params', () => {
      const route = {
        path: '/abc/:bar',
        query: ['foo', 'baz?', 'bar?=(\\d+)'],
        component: Noop,
      };
      // @ts-ignore
      expect(matchRoute([route], '/abc/def', parse('?foo'))).toMatchObject({
        route,
        match: {
          query: {
            foo: '',
          },
        },
      });
      expect(
        // @ts-ignore
        matchRoute([route], '/abc/def', parse('?foo&baz=cool'))
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
        // @ts-ignore
        matchRoute([route], '/abc/def', parse('?foo&bar=1&baz=cool'))
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
        // @ts-ignore
        matchRoute([route], '/abc/def', parse('?foo&baz=cool&bar=cool'))
      ).toBeNull();
    });

    it('should match when the third argument is a string', () => {
      const route = {
        path: '/abc/:bar',
        query: ['foo', 'baz?', 'bar?=(\\d+)'],
        component: Noop,
      };

      expect(
        // @ts-ignore
        matchRoute([route], '/abc/def', '?foo&bar=1&baz=cool')
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
    });

    it('should fail gracefully if passed invalid query string', () => {
      const route = {
        path: '/abc/:bar',
        query: ['foo'],
        component: Noop,
      };

      // @ts-ignore
      expect(matchRoute([route], '/abc/def', parse('?badstring=%'))).toBeNull();
      // @ts-ignore
      expect(matchRoute([route], '/abc/def', parse('?foo=%'))).toBeNull();
      // @ts-ignore
      expect(matchRoute([route], '/abc/def', parse('?foo=%2'))).toBeNull();
    });

    it('should handle non-standard characters', () => {
      const route = {
        path: '/abc/:bar',
        query: ['foo', 'bar?'],
        component: Noop,
      };

      expect(
        // @ts-ignore
        matchRoute([route], '/abc/def', parse('?foo=a%0Ab&bar=3')) // %0A == line feed
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
        // @ts-ignore
        matchRoute([route], '/abc/def', parse('?foo=a%00b&bar=3')) // %00 == null
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
        // @ts-ignore
        matchRoute([route], '/abc/def', parse('?foo=prøve&bar=3')) // ø is non-ascii character
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
