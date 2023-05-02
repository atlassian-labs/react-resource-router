import { mount } from 'enzyme';
import { createMemoryHistory } from 'history';
import React, { ReactNode } from 'react';

import { Route } from '../../common/types';
import * as isServerEnvironment from '../../common/utils/is-server-environment';

import { Router } from './index';

describe('<Router />', () => {
  const history = createMemoryHistory();
  const routes: Route[] = [];

  beforeEach(() => {
    jest
      .spyOn(isServerEnvironment, 'isServerEnvironment')
      .mockReturnValue(false);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders a RouterContainer', () => {
    const onPrefetch = jest.fn();
    const wrapper = mount(
      <Router
        basePath="/basepath"
        history={history}
        onPrefetch={onPrefetch}
        routes={routes}
      />
    );

    const component = wrapper.find('RouterContainer');

    expect(component).toHaveLength(1);
    expect(component.props()).toMatchObject({
      basePath: '/basepath',
      history,
      onPrefetch,
      routes,
    });
  });

  it('calls history.listen()() on unmount', () => {
    const unlisten = jest.fn();
    jest.spyOn(history, 'listen').mockReturnValue(unlisten);
    const wrapper = mount(<Router history={history} routes={routes} />);

    wrapper.unmount();

    expect(unlisten).toHaveBeenCalledTimes(1);
  });

  describe('when the router is re-mounted by a parent component', () => {
    it('cleans up the original history listener', () => {
      const RemountingParent = ({
        children,
        shouldRemount = false,
      }: {
        children: ReactNode;
        shouldRemount?: boolean;
      }) => {
        if (shouldRemount) {
          return <span>{children}</span>;
        }

        return <div>{children}</div>;
      };

      const listen = jest.spyOn(history, 'listen');
      const unlisten1 = jest.fn();
      const unlisten2 = jest.fn();

      listen.mockReturnValue(unlisten1);

      const wrapper = mount(
        <RemountingParent>
          <Router history={history} routes={routes} />
        </RemountingParent>
      );

      // first listener is created on mount
      expect(listen).toHaveBeenCalledTimes(1);

      listen.mockReturnValue(unlisten2);

      // trigger the re-mount
      wrapper.setProps({ shouldRemount: true });

      // second listener is created by the RouterContainer on re-mount
      expect(listen).toHaveBeenCalledTimes(2);

      // the original unlistener is called and the new one is not called
      expect(unlisten1).toHaveBeenCalled();
      expect(unlisten2).not.toHaveBeenCalled();
    });
  });
});
