import { shallow } from 'enzyme';
import React from 'react';

import * as store from '../router-store';
import { EntireRouterState } from '../router-store/types';

import { RouterSubscriber } from './index';

describe('<RouterSubscriber />', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  function renderRouterSubscriber(state: Partial<EntireRouterState>) {
    const listen = jest.fn();

    jest
      .spyOn(store, 'useRouterStore')
      // @ts-expect-error
      .mockImplementation(() => [state, { listen }]);

    shallow(<RouterSubscriber>{() => <div />}</RouterSubscriber>);

    return { listen };
  }

  it('should call listen if container is not inited', () => {
    const { listen } = renderRouterSubscriber({ unlisten: null });

    expect(listen).toHaveBeenCalled();
  });

  it('should not call listen if container is inited', () => {
    const { listen } = renderRouterSubscriber({ unlisten: () => null });

    expect(listen).not.toHaveBeenCalled();
  });

  it('should not call listen if container is static', () => {
    const { listen } = renderRouterSubscriber({
      isStatic: true,
      unlisten: () => null,
    });

    expect(listen).not.toHaveBeenCalled();
  });
});
