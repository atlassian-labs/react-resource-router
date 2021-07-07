import { DEFAULT_RESOURCE_MAX_AGE } from '../../../../../../controllers/resource-store/constants';
import { getDefaultStateSlice } from '../../../../../../controllers/resource-store/utils/get-default-state-slice';

describe('get default state slice', () => {
  it('should return the correct default state slice', () => {
    jest.spyOn(global.Date, 'now').mockReturnValue(0);

    expect(getDefaultStateSlice()).toEqual({
      data: null,
      error: null,
      loading: false,
      promise: null,
      expiresAt: DEFAULT_RESOURCE_MAX_AGE,
    });
  });
});
