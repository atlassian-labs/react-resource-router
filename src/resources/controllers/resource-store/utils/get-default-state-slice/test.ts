import { DEFAULT_RESOURCE_MAX_AGE } from '../create-resource/constants';

import { getDefaultStateSlice } from './index';

describe('getDefaultStateSlice()', () => {
  it('should return the correct default state slice', () => {
    jest.spyOn(global.Date, 'now').mockReturnValue(0);

    expect(getDefaultStateSlice()).toEqual({
      data: null,
      error: null,
      loading: false,
      promise: null,
      expiresAt: DEFAULT_RESOURCE_MAX_AGE,
      accessedAt: 0,
    });
  });
});
