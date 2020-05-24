import React from 'react';

import { mount } from 'enzyme';
import { createMemoryHistory } from 'history';
import { defaultRegistry } from 'react-sweet-state';

import { DEFAULT_ACTION, DEFAULT_ROUTE } from '../../../../common/constants';
import { Router } from '../../../../controllers/router';
import { withRouter } from '../../../../controllers/with-router';
import { RouterSubscriber } from '../../../../controllers/subscribers/route';

const waitALilBit = () => new Promise(resolve => setTimeout(resolve));

describe('withRouter', () => {
  const ComponentToBeWrapped = (props: any) => (
    <div> deep component {props.foo} </div>
  );
  const ComponentWithRouter = withRouter(ComponentToBeWrapped);

  beforeEach(() => {
    defaultRegistry.stores.clear();
  });

  test('should pass original props to the wrapped component', () => {
    const wrapper = mount(<ComponentWithRouter foo={'bar'} />);
    expect(wrapper.find(ComponentToBeWrapped).prop('foo')).toEqual('bar');
  });

  test('should provide match, route, location and history props to the wrapped component', () => {
    const history = createMemoryHistory();
    const wrapper = mount(
      <Router history={history} routes={[]}>
        <ComponentWithRouter foo={'bar'} />
      </Router>
    );
    expect(wrapper.find(ComponentToBeWrapped).props()).toEqual({
      foo: 'bar',
      location: {
        hash: '',
        pathname: '/',
        search: '',
      },
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
        path: '/atlassian/:name',
        component: () => <div> Example A</div>,
      },
      {
        path: '/cats',
        component: () => <div> Example B</div>,
      },
      { path: '/', component: () => <div> Home </div> },
    ];

    const wrapper = mount(
      // @ts-ignore
      <Router history={history} routes={routes}>
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
      <Router history={history} routes={[]}>
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

  test('should set a displayName to the wrapped component', () => {
    const wrapper = mount(<ComponentWithRouter foo={'bar'} />);
    expect(wrapper.find('withRouter(ComponentToBeWrapped)')).toHaveLength(1);
  });

  test('should render a RouterSubscriber', () => {
    const wrapper = mount(<ComponentWithRouter foo={'bar'} />);

    expect(wrapper.find(RouterSubscriber)).toHaveLength(1);
  });
});
