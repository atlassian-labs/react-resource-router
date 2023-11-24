import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import React from 'react';

import { useTimeout } from './index';

const DEFAULT_DELAY = 1000;

const TestComponent = ({
  callback,
  delay = DEFAULT_DELAY,
}: {
  callback: () => void;
  delay?: number;
}) => {
  const { schedule, cancel } = useTimeout(delay);

  return (
    <>
      <button name="schedule" onClick={() => schedule(callback)}>
        schedule
      </button>
      <button name="cancel" onClick={cancel}>
        cancel
      </button>
    </>
  );
};

describe('useTimeout()', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('calls setTimeout on schedule()', async () => {
    const user = userEvent.setup({
      delay: DEFAULT_DELAY,
      advanceTimers: delay => jest.advanceTimersByTime(delay),
    });
    const callback = jest.fn();
    render(<TestComponent callback={callback} />);

    await user.click(screen.getByRole('button', { name: 'schedule' }));

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('calls clearTimeout on cancel()', async () => {
    const user = userEvent.setup({
      delay: DEFAULT_DELAY,
      advanceTimers: delay => jest.advanceTimersByTime(delay),
    });
    const clearTimeout = jest.spyOn(global, 'clearTimeout');
    render(<TestComponent callback={jest.fn()} />);

    await user.click(screen.getByRole('button', { name: 'cancel' }));

    expect(clearTimeout).toHaveBeenCalledTimes(1);
  });

  it('schedules a callback to be fired', async () => {
    const user = userEvent.setup({
      delay: DEFAULT_DELAY,
      advanceTimers: delay => jest.advanceTimersByTime(delay),
    });
    const callback = jest.fn();
    render(<TestComponent callback={callback} />);

    await user.click(screen.getByRole('button', { name: 'schedule' }));

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('cancels a scheduled callback', async () => {
    const user = userEvent.setup({
      advanceTimers: delay => jest.advanceTimersByTime(delay),
    });
    const callback = jest.fn();
    render(<TestComponent callback={callback} />);

    await user.click(screen.getByRole('button', { name: 'schedule' }));
    await user.click(screen.getByRole('button', { name: 'cancel' }));

    jest.advanceTimersByTime(DEFAULT_DELAY);

    expect(callback).not.toHaveBeenCalled();
  });

  it('cancels a previously scheduled callback when schedule is called again', async () => {
    const user = userEvent.setup({
      advanceTimers: delay => jest.advanceTimersByTime(delay),
    });
    const callback1 = jest.fn();
    const callback2 = jest.fn();
    const { rerender } = render(<TestComponent callback={callback1} />);

    await user.click(screen.getByRole('button', { name: 'schedule' }));
    rerender(<TestComponent callback={callback2} />);
    await user.click(screen.getByRole('button', { name: 'schedule' }));

    jest.advanceTimersByTime(DEFAULT_DELAY);

    expect(callback1).not.toHaveBeenCalled();
    expect(callback2).toHaveBeenCalledTimes(1);
  });
});
