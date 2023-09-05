import { render } from 'enzyme';
import noop from 'lodash.noop';
import React from 'react';
import { defaultRegistry } from 'react-sweet-state';

import { Router } from '../router';

import { RouterActions } from './index';

const MockLocation = {
  pathname: 'pathname',
  search: 'search',
  hash: 'hash',
};

const HistoryMock = {
  push: jest.fn(),
  replace: jest.fn(),
  goBack: jest.fn(),
  goForward: jest.fn(),
  block: jest.fn(),
  listen: () => jest.fn(),
  location: MockLocation,
  _history: jest.fn(),
};

describe('<RouterActions />', () => {
  window.history.replaceState = jest.fn();
  window.history.back = jest.fn();
  window.history.forward = jest.fn();

  const { location } = window;

  beforeAll(() => {
    // @ts-ignore
    delete window.location;
    // @ts-ignore
    window.location = {};
    Object.defineProperties(window.location, {
      assign: { value: jest.fn() },
    });
  });

  afterEach(() => {
    defaultRegistry.stores.clear();
  });

  afterAll(() => {
    window.location = location;
  });

  test('when no history is provided it should fall back to default link actions', () => {
    let unblockMethod;

    render(
      <RouterActions>
        {({ push, replace, goBack, goForward, registerBlock }) => {
          push('push');
          replace('replace');
          goBack();
          goForward();
          unblockMethod = registerBlock(jest.fn());

          return <div>Link Action here</div>;
        }}
      </RouterActions>
    );

    expect(window.location.assign).toBeCalledWith('push');
    expect(window.history.replaceState).toBeCalledWith({}, '', 'replace');
    expect(window.history.back).toBeCalled();
    expect(window.history.forward).toBeCalled();

    expect(unblockMethod).toEqual(noop);
  });

  test('when history is provided should use history methods', () => {
    const unblockMethod = jest.fn();
    const blockCallback = jest.fn();
    let unblocker;

    HistoryMock.block.mockReturnValue(unblockMethod);

    render(
      // @ts-ignore
      <Router history={HistoryMock} routes={[]}>
        <RouterActions>
          {({ push, replace, goBack, goForward, registerBlock }) => {
            push('push');
            replace('replace');
            goBack();
            goForward();
            unblocker = registerBlock(blockCallback);

            return <div>Link Action here</div>;
          }}
        </RouterActions>
      </Router>
    );

    expect(HistoryMock.push).toBeCalledWith('push', undefined);
    expect(HistoryMock.replace).toBeCalledWith('replace');
    expect(HistoryMock.goBack).toBeCalled();
    expect(HistoryMock.goForward).toBeCalled();
    expect(HistoryMock.block).toHaveBeenCalledWith(blockCallback);
    expect(unblocker).toEqual(unblockMethod);
  });
});
