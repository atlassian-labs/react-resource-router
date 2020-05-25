import React from 'react';

import { mount } from 'enzyme';

import { Router } from '../../../../controllers/router';

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
  registerBlock: jest.fn(),
  listen: jest.fn(),
  createHref: jest.fn(),
  location: MockLocation,
  _history: jest.fn(),
};

const unlistenMock = jest.fn();

const routes: any[] = [];

describe('<Router />', () => {
  beforeEach(() => {
    HistoryMock.listen.mockReturnValue(unlistenMock);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders a RouterContainer', () => {
    const wrapper = mount(
      // @ts-ignore
      <Router history={HistoryMock} routes={routes}>
        <div>hello</div>
      </Router>
    );

    const component = wrapper.find('RouterContainer');

    expect(component).toHaveLength(1);

    expect(component.props()).toEqual(
      expect.objectContaining({
        history: HistoryMock,
        routes,
      })
    );
  });

  it('should call the history unlistener on unmount', () => {
    const wrapper = mount(
      // @ts-ignore
      <Router history={HistoryMock} routes={routes}>
        <div>hello</div>
      </Router>
    );

    wrapper.unmount();

    expect(unlistenMock).toHaveBeenCalledTimes(1);
  });

  describe('when the router is re-mounted by a parent component', () => {
    it('should clean up the original history listener', () => {
      // @ts-ignore
      const RemountingParent = ({ shouldRemount = false, children }) => {
        if (shouldRemount) {
          return <>{children}</>;
        }

        return <div>{children}</div>;
      };
      const newUnlistener = jest.fn();
      const router = (
        // @ts-ignore
        <Router history={HistoryMock} routes={routes}>
          <div>hello</div>
        </Router>
      );
      const wrapper = mount(<RemountingParent>{router}</RemountingParent>);

      // first listener is created on mount
      expect(HistoryMock.listen).toHaveBeenCalledTimes(1);

      HistoryMock.listen.mockReturnValue(newUnlistener);

      // trigger the re-mount
      wrapper.setProps({ shouldRemount: true });

      // second listener is created by the RouterContainer on re-mount
      expect(HistoryMock.listen).toHaveBeenCalledTimes(2);

      // the original unlistener is called and the new one is not called
      expect(unlistenMock).toHaveBeenCalledTimes(1);
      expect(newUnlistener).toHaveBeenCalledTimes(0);
    });
  });
});
