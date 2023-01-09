import { getAccessedAt } from './index';

describe('getAccessedAt()', () => {
  it('should return current timestamp', () => {
    jest.spyOn(global.Date, 'now').mockReturnValue(10);

    expect(getAccessedAt()).toEqual(10);
  });
});
