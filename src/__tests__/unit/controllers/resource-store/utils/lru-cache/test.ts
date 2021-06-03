import {
  getValidResourceDataKeys,
  getLRUResourceKey,
} from '../../../../../../controllers/resource-store/utils/lru-cache';
import { DEFAULT_CACHE_MAX_LIMIT } from '../../../../../../controllers/resource-store/constants';
import { RouteResourceDataForType } from '../../../../../../common/types';

describe('lru-cache', () => {
  const routeResourceDataForType: RouteResourceDataForType = {
    home: {
      data: 'home',
      accessedAt: 1,
      expiresAt: 100,
    },
    about: {
      data: 'about',
      accessedAt: 2,
      expiresAt: 0,
    },
    shop: {
      data: 'shop',
      accessedAt: 3,
      expiresAt: 50,
    },
  };

  const currentTime = 10;

  beforeEach(() => {
    jest.spyOn(global.Date, 'now').mockReturnValue(currentTime);
  });

  describe('getValidResourceDataKeys', () => {
    it('should return all non expired resource data', () => {
      const keys = getValidResourceDataKeys(
        routeResourceDataForType,
        'contact'
      );
      expect(keys).toEqual(['home', 'shop']);
    });

    it('should not return resource data which are in loading state ', () => {
      const resourceData = {
        ...routeResourceDataForType,
        contact: {
          data: 'contact',
          accessedAt: 3,
          expiresAt: 20,
          loading: true,
        },
      };
      const keys = getValidResourceDataKeys(resourceData, 'contact');
      expect(keys).toEqual(['home', 'shop']);
    });

    it('should not return resource data which has the same key as the current key ', () => {
      const keys = getValidResourceDataKeys(routeResourceDataForType, 'home');
      expect(keys).toEqual(['shop']);
    });
  });

  describe('getLRUResourceKey', () => {
    it('should return null if max cache is equal to default cache limit', () => {
      const key = getLRUResourceKey(
        DEFAULT_CACHE_MAX_LIMIT,
        routeResourceDataForType,
        'home'
      );
      expect(key).toBeNull();
    });

    it('should return null if max cache is less than 1', () => {
      const key = getLRUResourceKey(0, routeResourceDataForType, 'home');
      expect(key).toBeNull();
    });

    it('should return null if keys for a type are less than the max cache value', () => {
      const key = getLRUResourceKey(2, routeResourceDataForType, 'home');
      expect(key).toBeNull();
    });

    it('should return the least recent key which is not equal to the current key if max cache is attained for a type', () => {
      expect(getLRUResourceKey(1, routeResourceDataForType, 'home')).toEqual(
        'shop'
      );

      expect(getLRUResourceKey(1, routeResourceDataForType, 'shop')).toEqual(
        'home'
      );
    });
  });
});
