import { normalizeToLocation } from '../../../../../common/utils/location';

describe('SPA Router location utils', () => {
  const location = {
    pathname: '/foo',
    search: '?query=param',
    hash: '#bar',
  };

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('normalizeToLocation()', () => {
    it('should convert a string value to a location object', () => {
      const pathname = '/my-page';
      const hash = '#heading';
      const search = '?foo=bar';

      const newLocation = normalizeToLocation(
        `${pathname}${search}${hash}`,
        location,
      );
      expect(newLocation).toHaveProperty('pathname', pathname);
      expect(newLocation).toHaveProperty('search', search);
      expect(newLocation).toHaveProperty('hash', hash);
    });

    it('should return location objects', () => {
      expect(normalizeToLocation({ ...location }, location)).toEqual(location);
    });
  });
});
