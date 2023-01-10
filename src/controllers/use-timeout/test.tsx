import React from 'react';
import { shallow } from 'enzyme';

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
      <button id="schedule" onClick={() => schedule(callback)} />
      <button id="cancel" onClick={cancel} />
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

  it('calls setTimeout on schedule()', () => {
    const setTimeout = jest.spyOn(global, 'setTimeout');
    const wrapper = shallow(<TestComponent callback={jest.fn()} />);

    wrapper.find('#schedule').simulate('click');

    expect(setTimeout).toHaveBeenCalledTimes(1);
  });

  it('calls clearTimeout on cancel()', () => {
    const clearTimeout = jest.spyOn(global, 'clearTimeout');
    const wrapper = shallow(<TestComponent callback={jest.fn()} />);

    wrapper.find('#cancel').simulate('click');

    expect(clearTimeout).toHaveBeenCalledTimes(1);
  });

  it('schedules a callback to be fired', () => {
    const callback = jest.fn();
    const wrapper = shallow(<TestComponent callback={callback} />);

    wrapper.find('#schedule').simulate('click');
    jest.runOnlyPendingTimers();

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('cancels a scheduled callback', () => {
    const callback = jest.fn();
    const wrapper = shallow(<TestComponent callback={callback} />);

    wrapper.find('#schedule').simulate('click');
    wrapper.find('#cancel').simulate('click');
    jest.runAllTimers();

    expect(callback).not.toHaveBeenCalled();
  });

  it('cancels a previously scheduled callback when schedule is called again', () => {
    const callback1 = jest.fn();
    const callback2 = jest.fn();
    const wrapper = shallow(<TestComponent callback={callback1} />);

    wrapper.find('#schedule').simulate('click');
    wrapper.setProps({ callback: callback2 });
    wrapper.find('#schedule').simulate('click');
    jest.runAllTimers();

    expect(callback1).not.toHaveBeenCalled();
    expect(callback2).toHaveBeenCalledTimes(1);
  });
});
