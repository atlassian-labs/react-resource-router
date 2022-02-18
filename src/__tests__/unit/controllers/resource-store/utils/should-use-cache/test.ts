import { mockRouteResourceResponse } from '../../../../../../common/mocks';
import {
  isFromSsr,
  shouldUseCache,
} from '../../../../../../controllers/resource-store/utils/should-use-cache';

describe('should use cache', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should use cached data if the resource is currently loading', () => {
    const response = { ...mockRouteResourceResponse, loading: true };

    expect(shouldUseCache(response)).toBeTruthy();
  });

  it('should use cached data if the resource has been hydrated on the server ie., expiresAt is null', () => {
    const response = {
      ...mockRouteResourceResponse,
      loading: false,
      expiresAt: null,
    };

    expect(shouldUseCache(response)).toBeTruthy();
  });

  it('should use cached data if the current timestamp has not yet reached the expiresAt value', () => {
    const response = { ...mockRouteResourceResponse, expiresAt: 2 };

    jest.spyOn(global.Date, 'now').mockReturnValue(1);

    expect(shouldUseCache(response)).toBeTruthy();
  });

  it('should use cached data if the data is a falsy primitive type and the resource has not expired', () => {
    const response = {
      ...mockRouteResourceResponse,
      expiresAt: 2,
      data: null,
      error: null,
    };

    jest.spyOn(global.Date, 'now').mockReturnValue(1);

    expect(shouldUseCache(response)).toBeTruthy();
  });

  it('should not use cached data if the resource has expired', () => {
    const response = { ...mockRouteResourceResponse, expiresAt: 1 };

    jest.spyOn(global.Date, 'now').mockReturnValue(5);

    expect(shouldUseCache(response)).toBeFalsy();
  });
});

describe('is from ssr', () => {
  it('should return true if the slice is from ssr', () => {
    const slice = { ...mockRouteResourceResponse, expiresAt: null };

    expect(isFromSsr(slice)).toBeTruthy();
  });

  it('should return false if the slice is not from ssr', () => {
    const slice = { ...mockRouteResourceResponse, expiresAt: 1 };

    expect(isFromSsr(slice)).toBeFalsy();
  });
});
