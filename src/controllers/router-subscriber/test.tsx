import { render } from '@testing-library/react';
import React from 'react';

import * as isServerEnvironment from '../../common/utils/is-server-environment';
import * as store from '../router-store';
import { EntireRouterState } from '../router-store/types';

import { RouterSubscriber } from './index';

describe('<RouterSubscriber />', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  function renderRouterSubscriber(
    state: Partial<EntireRouterState>,
    isServer = false
  ) {
    const listen = jest.fn();

    jest
      .spyOn(isServerEnvironment, 'isServerEnvironment')
      .mockReturnValue(isServer);

    jest
      .spyOn(store, 'useRouterStore')
      // @ts-expect-error
      .mockImplementation(() => [state, { listen }]);

    render(<RouterSubscriber>{() => <div />}</RouterSubscriber>);

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

  it('should not call listen if server environment', () => {
    const { listen } = renderRouterSubscriber({ unlisten: () => null }, true);

    expect(listen).not.toHaveBeenCalled();
  });
});
