import {
  getRelativePath,
  isAbsolutePath,
  isExternalAbsolutePath,
} from '../../../../../controllers/router-store/utils/path-utils';

describe('path utils', () => {
  describe('absolute paths', () => {
    it('should return true for absolute paths', () => {
      const paths = [
        'http://example.com',
        'https://example.com',
        'http://example.com/hello/world?name=foobar',
      ];

      paths.forEach(path => expect(isAbsolutePath(path)).toBeTruthy());
    });

    it('should return false for relative paths', () => {
      const paths = ['/boards', '/browse', '/issue?selectedIssue=9999'];

      paths.forEach(path => expect(isAbsolutePath(path)).toBeFalsy());
    });

    it('should get the relative path from the absolute url', () => {
      const basic = 'http://example.com/foobar';
      const withQueryString = 'http://example.com/foobar?foo=true&bar=false';
      const withHash = 'http://example.com/foobar?foo=true&bar=false#anchor';

      expect(getRelativePath(basic)).toEqual('/foobar');
      expect(getRelativePath(withQueryString)).toEqual(
        '/foobar?foo=true&bar=false',
      );
      expect(getRelativePath(withHash)).toEqual(
        '/foobar?foo=true&bar=false#anchor',
      );
    });
  });

  describe('relative paths', () => {
    it('should just return the path if a relative path is supplied', () => {
      const basic = '/foobar';
      const withQueryString = '/foobar?foo=true&bar=false';

      expect(getRelativePath(basic)).toEqual(basic);
      expect(getRelativePath(withQueryString)).toEqual(withQueryString);
    });

    it('should return the object if an object is provided', () => {
      const path = { search: 'foo=1' };

      // @ts-ignore mocking location
      expect(getRelativePath(path)).toEqual(path);
    });
  });

  describe('external paths', () => {
    it('should return false for relative paths', () => {
      const paths = ['/boards', '/browse', '/issue?selectedIssue=9999'];

      paths.forEach(path => expect(isExternalAbsolutePath(path)).toBeFalsy());
    });

    it('should return false for absolute paths on the same domain', () => {
      const paths = [
        'http://localhost:3000/browse',
        'http://localhost:3000/browse?issue=1',
        'http://localhost:3000/RapidBoards.jspa',
      ];

      paths.forEach(path => expect(isExternalAbsolutePath(path)).toBeFalsy());
    });

    it('should return true for absolute paths on a different domain', () => {
      const paths = [
        'http://example.com',
        'https://example.com',
        'http://example.com/hello/world?name=foobar',
      ];

      paths.forEach(path => expect(isExternalAbsolutePath(path)).toBeTruthy());
    });
  });
});
