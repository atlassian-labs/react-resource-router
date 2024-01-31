import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { createMemoryHistory } from 'history';
import React from 'react';
import { act } from 'react-dom/test-utils';
import { defaultRegistry } from 'react-sweet-state';

import { DEFAULT_ACTION, DEFAULT_ROUTE } from '../../common/constants';
import { Router } from '../router';

import { withRouter } from './index';

jest.mock('../../common/utils/is-server-environment');

describe('withRouter()', () => {
  beforeEach(() => {
    defaultRegistry.stores.clear();
  });

  it('should pass original props to the wrapped component and set displayName', () => {
    const ComponentToBeWrapped = (props: any) => (
      <div> deep component {props.foo} </div>
    );
    const ComponentWithRouter = withRouter(ComponentToBeWrapped);

    render(<ComponentWithRouter foo={'bar'} />);
    expect(screen.getByText('deep component bar')).toBeInTheDocument();
  });

  it('should provide match, route, location and history props to the wrapped component', () => {
    const history = createMemoryHistory();
    const MockComponent = jest.fn(() => null);
    const ComponentWithRouter = withRouter(MockComponent);

    render(
      <Router history={history} routes={[]} plugins={[]}>
        <ComponentWithRouter foo={'bar'} />
      </Router>
    );

    expect(MockComponent).toHaveBeenCalledWith(
      expect.objectContaining({
        foo: 'bar',
        location: expect.objectContaining({
          hash: '',
          pathname: '/',
          search: '',
        }),
        history: expect.any(Object),
        match: expect.objectContaining({
          isExact: expect.any(Boolean),
          path: expect.any(String),
          url: expect.any(String),
          params: expect.any(Object),
          query: expect.any(Object),
        }),
        route: DEFAULT_ROUTE,
        action: DEFAULT_ACTION,
        query: expect.any(Object),
        push: expect.any(Function),
        replace: expect.any(Function),
      }),
      {}
    );
  });

  it('should provide the matched route and current location to the wrapped component', async () => {
    const history = createMemoryHistory();
    const MockComponent = jest.fn(() => null);
    const ComponentWithRouter = withRouter(MockComponent);

    const routes = [
      {
        name: 'Example A',
        path: '/atlassian/:name',
        component: () => <div> Example A</div>,
      },
      {
        name: 'Example B',
        path: '/cats',
        component: () => <div> Example B</div>,
      },
      { name: 'Example C', path: '/', component: () => <div> Home </div> },
    ];

    render(
      <Router history={history} routes={routes} plugins={[]}>
        <ComponentWithRouter foo={'bar'} />
      </Router>
    );

    // Initial route
    expect(MockComponent).toHaveBeenCalledWith(
      expect.objectContaining({
        location: expect.objectContaining({
          pathname: '/',
        }),
        match: expect.objectContaining({
          isExact: true,
          params: {},
        }),
        action: DEFAULT_ACTION,
      }),
      {}
    );

    act(() => history.push('/atlassian/jira'));
    expect(MockComponent).toHaveBeenCalledWith(
      expect.objectContaining({
        location: expect.objectContaining({
          pathname: '/atlassian/jira',
        }),
        match: expect.objectContaining({
          params: { name: 'jira' },
        }),
        action: 'PUSH',
      }),
      {}
    );

    act(() => history.replace('/atlassian/foo'));
    expect(MockComponent).toHaveBeenCalledWith(
      expect.objectContaining({
        location: expect.objectContaining({
          pathname: '/atlassian/foo',
        }),
        match: expect.objectContaining({
          params: { name: 'foo' },
        }),
        action: 'REPLACE',
      }),
      {}
    );
  });

  it('should pass null match to the wrapped component when no route has matched', async () => {
    const history = createMemoryHistory();
    const MockComponent = jest.fn(() => null);
    const ComponentWithRouter = withRouter(MockComponent);

    render(
      <Router history={history} routes={[]} plugins={[]}>
        <ComponentWithRouter foo={'bar'} />
      </Router>
    );

    act(() => history.push('/blabla'));
    expect(MockComponent).toHaveBeenCalledWith(
      expect.objectContaining({
        match: expect.objectContaining({
          isExact: false,
          path: expect.any(String),
          url: expect.any(String),
          params: expect.any(Object),
          query: expect.any(Object),
        }),
      }),
      {}
    );
  });
});
