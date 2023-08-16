import { isSameRouteMatch } from '../../../common/utils';
import { mockRouteContext } from '../../../mocks';

import {
  getRelativePath,
  isAbsolutePath,
  isExternalAbsolutePath,
  updateQueryParams,
  sanitizePath,
  shouldReload,
} from './index';

jest.mock('../../../common/utils');

describe('isAbsolutePath()', () => {
  it('should return true when given an absolute path', () => {
    const paths = [
      'http://example.com',
      'https://example.com',
      'http://example.com/hello/world?name=foobar',
    ];

    paths.forEach(path => expect(isAbsolutePath(path)).toBeTruthy());
  });

  it('should return false when given a relative path', () => {
    const paths = ['/boards', '/browse', '/issue?selectedIssue=9999'];

    paths.forEach(path => expect(isAbsolutePath(path)).toBeFalsy());
  });
});

describe('getRelativePath()', () => {
  it('should return the input path if a relative path is supplied', () => {
    const basic = '/foobar';
    const withQueryString = '/foobar?foo=true&bar=false';

    expect(getRelativePath(basic)).toEqual(basic);
    expect(getRelativePath(withQueryString)).toEqual(withQueryString);
  });

  it('should return the input object if an object is provided', () => {
    const path = { search: 'foo=1' };

    // @ts-ignore mocking location
    expect(getRelativePath(path)).toEqual(path);
  });

  it('should return the relative path from an absolute url', () => {
    const basic = 'http://example.com/foobar';
    const withQueryString = 'http://example.com/foobar?foo=true&bar=false';
    const withHash = 'http://example.com/foobar?foo=true&bar=false#anchor';

    expect(getRelativePath(basic)).toEqual('/foobar');
    expect(getRelativePath(withQueryString)).toEqual(
      '/foobar?foo=true&bar=false'
    );
    expect(getRelativePath(withHash)).toEqual(
      '/foobar?foo=true&bar=false#anchor'
    );
  });
});

describe('isExternalAbsolutePath()', () => {
  it('should return false given a relative path', () => {
    const paths = ['/boards', '/browse', '/issue?selectedIssue=9999'];

    paths.forEach(path => expect(isExternalAbsolutePath(path)).toBeFalsy());
  });

  it('should return false given an absolute path on the same domain', () => {
    const paths = [
      'http://localhost:3000/browse',
      'http://localhost:3000/browse?issue=1',
      'http://localhost:3000/RapidBoards.jspa',
    ];

    paths.forEach(path => expect(isExternalAbsolutePath(path)).toBeFalsy());
  });

  it('should return true given an absolute path on a different domain', () => {
    const paths = [
      'http://example.com',
      'https://example.com',
      'http://example.com/hello/world?name=foobar',
    ];

    paths.forEach(path => expect(isExternalAbsolutePath(path)).toBeTruthy());
  });
});

describe('updateQueryParams()', () => {
  it('should update query params in URL without hash', () => {
    const location = {
      pathname: '/browse',
      search: '?foo=hello&bar=world',
      hash: '',
    };

    const query = {
      foo: 'newVal',
    };

    const expectedOutput = '/browse?foo=newVal';

    expect(updateQueryParams(location, query)).toEqual(expectedOutput);
  });

  it('should update query params in URL with hash', () => {
    const location = {
      pathname: '/browse',
      search: '?foo=hello&bar=world',
      hash: '#abc',
    };

    const query = {
      foo: 'newVal',
    };

    const expectedOutput = '/browse?foo=newVal#abc';

    expect(updateQueryParams(location, query)).toEqual(expectedOutput);
  });

  it('should return proper URL when query obj is empty', () => {
    const location = {
      pathname: '/browse',
      search: '?foo=hello&bar=world',
      hash: '#abc',
    };

    const query = {};

    const expectedOutput = '/browse#abc';

    expect(updateQueryParams(location, query)).toEqual(expectedOutput);
  });

  it('should return proper URL', () => {
    const location = {
      pathname: '/browse',
      search: '',
      hash: '#abc',
    };

    const query = { foo: 'newVal' };

    const expectedOutput = '/browse?foo=newVal#abc';

    expect(updateQueryParams(location, query)).toEqual(expectedOutput);
  });
});

describe('sanitizePath()', () => {
  it('should sanitize path + basePath', () => {
    const path = '/path';
    const basePath = '/base';

    const expectedOutput = '/base/path';
    expect(sanitizePath(path, basePath)).toEqual(expectedOutput);
  });

  it('should sanitize path without basePath', () => {
    const path = '/path';
    const basePath = '';

    const expectedOutput = '/path';
    expect(sanitizePath(path, basePath)).toEqual(expectedOutput);
  });

  it('should format the slashes before appending', () => {
    const path = 'path';
    const basePath = 'base';

    const expectedOutput = '/base/path';
    expect(sanitizePath(path, basePath)).toEqual(expectedOutput);
  });
});

describe('shouldReload()', () => {
  beforeEach(() => {
    (isSameRouteMatch as any).mockReturnValue(false);
  });
  it('should return defaultValue when routes are not the same', () => {
    const context = {
      ...mockRouteContext,
      route: {
        ...mockRouteContext.route,
      },
    };
    const prevContext = {
      ...mockRouteContext,
      match: {
        ...mockRouteContext.match,
      },
    };

    expect(
      shouldReload({
        context,
        prevContext,
        pluginId: 'test-plugin',
      })
    ).toBeTruthy();
  });

  it('should return defaultValue when route does not specify EXPERIMENTAL__shouldReload prop', () => {
    const context = {
      ...mockRouteContext,
    };
    const prevContext = {
      ...mockRouteContext,
    };

    expect(
      shouldReload({
        context,
        prevContext,
        pluginId: 'test-plugin',
      })
    ).toBeTruthy();
  });

  it('should use EXPERIMENTAL__shouldReload when specified', () => {
    const route = {
      ...mockRouteContext.route,
      EXPERIMENTAL__shouldReload: () => false,
    };

    const context = {
      ...mockRouteContext,
      route,
    };
    const prevContext = {
      ...mockRouteContext,
      route,
    };

    expect(
      shouldReload({
        context,
        prevContext,
        pluginId: 'test-plugin',
      })
    ).toBeFalsy();
  });

  it("should return defaultValue=false as route haven't changed", () => {
    (isSameRouteMatch as any).mockReturnValue(true);
    const context = {
      ...mockRouteContext,
    };
    const prevContext = {
      ...mockRouteContext,
    };

    expect(
      shouldReload({
        context,
        prevContext,
        pluginId: 'test-plugin',
      })
    ).toBeFalsy();
  });

  it('should return defaultValue=true for resources-plugin', () => {
    (isSameRouteMatch as any).mockReturnValue(true);
    const context = {
      ...mockRouteContext,
    };
    const prevContext = {
      ...mockRouteContext,
    };

    expect(
      shouldReload({
        context,
        prevContext,
        pluginId: 'resources-plugin',
      })
    ).toBeTruthy();
  });
});
