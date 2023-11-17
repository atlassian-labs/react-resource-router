import { render, screen } from '@testing-library/react';
import { createMemoryHistory } from 'history';
import React from 'react';

import { Route } from '../../common/types';
import * as isServerEnvironment from '../../common/utils/is-server-environment';

import { Router } from './index';

describe('<Router />', () => {
  const basePath = '/basepath';
  const history = createMemoryHistory();
  const routes: Route[] = [
    {
      component: () => <p>test</p>,
      name: 'mock-route',
      path: '/',
    },
  ];

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
    render(
      <Router
        basePath={basePath}
        history={history}
        onPrefetch={onPrefetch}
        routes={routes}
        plugins={[]}
      >
        <p>test</p>
      </Router>
    );

    expect(screen.getByText('test')).toBeInTheDocument();
  });

  it('calls history.listen()() on unmount', () => {
    const unlisten = jest.fn();
    jest.spyOn(history, 'listen').mockReturnValue(unlisten);

    const { unmount } = render(
      <Router history={history} routes={routes} plugins={[]} />
    );

    unmount();

    expect(unlisten).toHaveBeenCalledTimes(1);
  });

  describe('when the router is re-mounted by a parent component', () => {
    it('cleans up the original history listener', () => {
      const RemountingParent = ({
        children,
        shouldRemount = false,
      }: {
        children: React.ReactNode;
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

      const { rerender } = render(
        <RemountingParent>
          <Router history={history} routes={routes} plugins={[]} />
        </RemountingParent>
      );

      expect(listen).toHaveBeenCalledTimes(1);

      listen.mockReturnValue(unlisten2);

      rerender(
        <RemountingParent shouldRemount={true}>
          <Router history={history} routes={routes} plugins={[]} />
        </RemountingParent>
      );

      expect(listen).toHaveBeenCalledTimes(2);

      expect(unlisten1).toHaveBeenCalled();
      expect(unlisten2).not.toHaveBeenCalled();
    });
  });
});
