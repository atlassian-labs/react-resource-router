import { createLocation } from './index';

describe.each([
  {
    input: '/a/b?c=d#e',
    description: 'full path',
    pathname: '/a/b',
    search: '?c=d',
    hash: '#e',
  },
  {
    input: 'a/b?c=d#e',
    description: 'relative path',
    pathname: 'a/b',
    search: '?c=d',
    hash: '#e',
  },
  {
    input: '?a=b#c',
    description: 'no pathname',
    pathname: '/',
    search: '?a=b',
    hash: '#c',
  },
  {
    input: '/a/b#c',
    description: 'no search',
    pathname: '/a/b',
    search: '',
    hash: '#c',
  },
  {
    input: '/a/b?c=d',
    description: 'no hash',
    pathname: '/a/b',
    search: '?c=d',
    hash: '',
  },
  {
    input: '/a/b#c?d=e',
    description: 'search in hash',
    pathname: '/a/b',
    search: '',
    hash: '#c?d=e',
  },
])(
  'createLocation($input): { pathname, search, hash }',
  ({ input, description, pathname, search, hash }) => {
    test(description, () => {
      expect(createLocation(input)).toMatchObject({
        pathname,
        search,
        hash,
      });
    });
  }
);
