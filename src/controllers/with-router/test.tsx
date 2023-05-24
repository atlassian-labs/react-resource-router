import { mount } from 'enzyme';
import { createMemoryHistory } from 'history';
import React from 'react';
import { defaultRegistry } from 'react-sweet-state';

import { DEFAULT_ACTION, DEFAULT_ROUTE } from '../../common/constants';
import { Router } from '../router';

import { withRouter } from './index';

const waitALilBit = () => new Promise(resolve => setTimeout(resolve));

jest.mock('../../common/utils/is-server-environment');

describe('withRouter()', () => {
  const ComponentToBeWrapped = (props: any) => (
    <div> deep component {props.foo} </div>
  );
  const ComponentWithRouter = withRouter(ComponentToBeWrapped);

  beforeEach(() => {
    defaultRegistry.stores.clear();
  });

  test('should pass original props to the wrapped component and set displayName', () => {
    const wrapper = mount(<ComponentWithRouter foo={'bar'} />);
    expect(wrapper.find(ComponentToBeWrapped).prop('foo')).toEqual('bar');
    expect(wrapper.find('withRouter(ComponentToBeWrapped)')).toHaveLength(1);
  });

  test('should provide match, route, location and history props to the wrapped component', () => {
    const history = createMemoryHistory();
    const wrapper = mount(
      <Router history={history} routes={[]} plugins={[]}>
        <ComponentWithRouter foo={'bar'} />
      </Router>
    );
    expect(wrapper.find(ComponentToBeWrapped).props()).toEqual({
      foo: 'bar',
      location: expect.objectContaining({
        hash: '',
        pathname: '/',
        search: '',
      }),
      history,
      match: expect.objectContaining({
        isExact: false,
        path: expect.any(String),
        url: expect.any(String),
        params: expect.any(Object),
        query: expect.any(Object),
      }),
      route: DEFAULT_ROUTE,
      action: DEFAULT_ACTION,
      query: {},
      push: expect.any(Function),
      replace: expect.any(Function),
    });
  });

  test('should provide the matched route and current location to the wrapped component', async () => {
    const history = createMemoryHistory();
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

    const wrapper = mount(
      <Router history={history} routes={routes} plugins={[]}>
        <ComponentWithRouter foo={'bar'} />
      </Router>
    );

    expect(wrapper.find(ComponentToBeWrapped).props()).toMatchObject({
      location: {
        hash: '',
        pathname: '/',
        search: '',
      },
      match: {
        isExact: true,
        params: {},
        path: '/',
        url: '/',
      },
      action: DEFAULT_ACTION,
    });

    history.push('/atlassian/jira');

    await waitALilBit();

    wrapper.update();
    expect(wrapper.find(ComponentToBeWrapped).props()).toMatchObject({
      location: {
        hash: '',
        pathname: '/atlassian/jira',
        search: '',
      },
      match: {
        isExact: true,
        params: { name: 'jira' },
        path: '/atlassian/:name',
        url: '/atlassian/jira',
      },
      action: 'PUSH',
    });

    history.replace('/atlassian/foo');

    await waitALilBit();

    wrapper.update();
    expect(wrapper.find(ComponentToBeWrapped).props()).toMatchObject({
      location: {
        hash: '',
        pathname: '/atlassian/foo',
        search: '',
      },
      match: {
        isExact: true,
        params: { name: 'foo' },
        path: '/atlassian/:name',
        url: '/atlassian/foo',
      },
      action: 'REPLACE',
    });
  });

  test('should pass null match to the wrapped component when no route has matched', () => {
    const history = createMemoryHistory();
    const wrapper = mount(
      <Router history={history} routes={[]} plugins={[]}>
        <ComponentWithRouter foo={'bar'} />
      </Router>
    );
    history.push('/blabla');
    wrapper.update();
    expect(wrapper.find(ComponentToBeWrapped).prop('match')).toEqual(
      expect.objectContaining({
        isExact: false,
        path: expect.any(String),
        url: expect.any(String),
        params: expect.any(Object),
        query: expect.any(Object),
      })
    );
  });
});
