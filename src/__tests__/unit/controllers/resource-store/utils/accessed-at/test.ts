import { getAccessedAt } from '../../../../../../controllers/resource-store/utils/accessed-at';

describe('get accessed at', () => {
  it('should return current timestamp', () => {
    jest.spyOn(global.Date, 'now').mockReturnValue(10);

    expect(getAccessedAt()).toEqual(10);
  });
});
