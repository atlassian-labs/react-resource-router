import { generateTimeGuard } from '../../../../../../controllers/resource-store/utils/generate-time-guard';

describe('generate time guard', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  it('should set pending to true while promise is pending', async () => {
    const timeGuard = generateTimeGuard(1000);
    expect(timeGuard.isPending).toBe(true);
  });

  it('should set pending to false when promise is resolved', async () => {
    const timeGuard = generateTimeGuard(1000);
    jest.runAllTimers();
    await timeGuard.promise;
    expect(timeGuard.isPending).toBe(false);
  });

  it('should return timer id', async () => {
    const timeGuard = generateTimeGuard(1000);
    expect(typeof timeGuard.timerId).toBe('number');
  });
});
