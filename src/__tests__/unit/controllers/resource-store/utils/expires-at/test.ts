import { mockRouteResourceResponse } from '../../../../../../common/mocks';
import {
  getExpiresAt,
  setExpiresAt,
} from '../../../../../../controllers/resource-store/utils/expires-at';

describe('get expires at', () => {
  it('should return the value passed plus the current timestamp', () => {
    jest.spyOn(global.Date, 'now').mockReturnValue(10);

    expect(getExpiresAt(100)).toEqual(110);
  });
});

describe('set expires at', () => {
  it('should return an object with expiresAt set if it was null when passed', () => {
    const mock = { ...mockRouteResourceResponse, expiresAt: null };

    jest.spyOn(global.Date, 'now').mockReturnValue(0);

    expect(setExpiresAt(mock, 10)).toEqual({
      ...mockRouteResourceResponse,
      expiresAt: 10,
    });
  });

  it('should return an object with the same expiresAt as passed if it was not null', () => {
    expect(setExpiresAt(mockRouteResourceResponse, 100)).toEqual(
      mockRouteResourceResponse,
    );
  });
});
