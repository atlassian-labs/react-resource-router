import {
  getRelativePath,
  isAbsolutePath,
  isExternalAbsolutePath,
  updateQueryParams,
  sanitizePath,
  isSameRoute,
} from './index';

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

describe('isSameRoute', () => {
  it('should be true', () => {
    const prevContextMatch = {
      params: {},
      isExact: false,
      path: 'jira.com',
      url: '',
      query: {},
    };

    const nextContextMatch = {
      params: {},
      isExact: false,
      path: 'jira.com',
      url: '',
      query: {},
    };
    expect(isSameRoute({ prevContextMatch, nextContextMatch })).toBeTruthy();
  });

  it('should be false, as "query" is different', () => {
    const prevContextMatch = {
      params: {},
      isExact: false,
      path: '',
      url: '',
      query: {},
    };

    const nextContextMatch = {
      params: {},
      isExact: false,
      path: '',
      url: '',
      query: {
        a: '1',
      },
    };
    expect(isSameRoute({ prevContextMatch, nextContextMatch })).toBeFalsy();
  });

  it('should be false, as "params" are different', () => {
    const prevContextMatch = {
      params: {},
      isExact: false,
      path: '',
      url: '',
      query: {},
    };

    const nextContextMatch = {
      params: {
        a: '1',
      },
      isExact: false,
      path: '',
      url: '',
      query: {},
    };
    expect(isSameRoute({ prevContextMatch, nextContextMatch })).toBeFalsy();
  });

  it('should be false, as "path" is different', () => {
    const prevContextMatch = {
      params: {},
      isExact: false,
      path: 'jira.com',
      url: '',
      query: {},
    };

    const nextContextMatch = {
      params: {},
      isExact: false,
      path: 'jira.com/issues',
      url: '',
      query: {},
    };
    expect(isSameRoute({ prevContextMatch, nextContextMatch })).toBeFalsy();
  });

  it('should return true, even though "query" props are in different order', () => {
    const prevContextMatch = {
      params: {},
      isExact: false,
      path: '',
      url: '',
      query: {
        a: '1',
        b: '2',
      },
    };

    const nextContextMatch = {
      params: {},
      isExact: false,
      path: '',
      url: '',
      query: {
        b: '2',
        a: '1',
      },
    };
    expect(isSameRoute({ prevContextMatch, nextContextMatch })).toBeTruthy();
  });

  it('should return true, even though "params" props are in different order', () => {
    const prevContextMatch = {
      params: {
        a: '1',
        b: '2',
      },
      isExact: false,
      path: '',
      url: '',
      query: {},
    };

    const nextContextMatch = {
      params: {
        b: '2',
        a: '1',
      },
      isExact: false,
      path: '',
      url: '',
      query: {},
    };
    expect(isSameRoute({ prevContextMatch, nextContextMatch })).toBeTruthy();
  });
});
