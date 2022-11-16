import { shallow } from 'enzyme';
import React from 'react';
import { useTimeout } from '../../../../../common/utils';

const setTimeoutSpy = jest.spyOn(global, 'setTimeout');
const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

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

describe('useTimeout', () => {
  const mockCallback = jest.fn();

  beforeEach(() => {
    mockCallback.mockClear();
    setTimeoutSpy.mockClear();
    clearTimeoutSpy.mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('calls setTimeout on schedule()', () => {
    const wrapper = shallow(<TestComponent callback={mockCallback} />);
    wrapper.find('#schedule').simulate('click');
    expect(setTimeoutSpy).toHaveBeenCalledTimes(1);
  });

  it('calls clearTimeout on cancel()', () => {
    const wrapper = shallow(<TestComponent callback={mockCallback} />);
    wrapper.find('#cancel').simulate('click');
    expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);
  });

  it('schedules a callback to be fired', () => {
    jest.useFakeTimers();
    const wrapper = shallow(<TestComponent callback={mockCallback} />);
    wrapper.find('#schedule').simulate('click');
    jest.runOnlyPendingTimers();
    expect(mockCallback).toHaveBeenCalledTimes(1);
  });

  it('cancels a scheduled callback', () => {
    jest.useFakeTimers();
    const wrapper = shallow(<TestComponent callback={mockCallback} />);
    wrapper.find('#schedule').simulate('click');
    wrapper.find('#cancel').simulate('click');
    jest.runAllTimers();
    expect(mockCallback).not.toHaveBeenCalled();
  });

  it('cancels a previously scheduled callback when schedule is called again', () => {
    const mockCallback2 = jest.fn();
    jest.useFakeTimers();
    const wrapper = shallow(<TestComponent callback={mockCallback} />);
    wrapper.find('#schedule').simulate('click');
    wrapper.setProps({ callback: mockCallback2 });
    wrapper.find('#schedule').simulate('click');

    jest.runAllTimers();

    expect(mockCallback).not.toHaveBeenCalled();
    expect(mockCallback2).toHaveBeenCalledTimes(1);
  });
});
