import { mount } from 'enzyme';
import React from 'react';
import { defaultRegistry } from 'react-sweet-state';

import type { Route } from '../../common/types';
import { Router } from '../router';

import { Redirect, RedirectProps } from './index';

const MockLocation = {
  pathname: 'pathname',
  search: '',
  hash: '',
};

const MockHistory = {
  push: jest.fn(),
  replace: jest.fn(),
  goBack: jest.fn(),
  goForward: jest.fn(),
  block: jest.fn(),
  registerBlock: jest.fn(),
  listen: () => jest.fn(),
  createHref: jest.fn(),
  location: MockLocation,
  _history: jest.fn(),
};

const defaultArgs = {
  to: '',
  push: true,
};

const mockConsole = { ...global.console, warn: jest.fn() };
const mockRoute: Route = {
  name: 'test',
  component: () => null,
  path: '/:id',
  query: ['foo'],
};

describe('<Redirect />', () => {
  const mountInRouter = (args: Partial<RedirectProps>) =>
    mount(
      // @ts-expect-error
      <Router history={MockHistory} routes={[]}>
        <Redirect {...defaultArgs} {...args} />
      </Router>
    );

  let globalConsole: any;

  const { location } = window;

  beforeAll(() => {
    // @ts-expect-error
    delete window.location;
    // @ts-expect-error
    window.location = {};
    Object.defineProperties(window.location, {
      assign: { value: jest.fn() },
    });
    globalConsole = global.console;
    global.console = mockConsole;
  });

  afterEach(() => {
    defaultRegistry.stores.clear();
    jest.resetAllMocks();
  });

  afterAll(() => {
    window.location = location;
    global.console = globalConsole;
  });

  it("doesn't break / throw when rendered with string `to`", () => {
    const to = '/cool-page';

    expect(() => mountInRouter({ to })).not.toThrow();
    expect(MockHistory.push).toHaveBeenCalledWith(to);
  });

  it("doesn't break / throw when rendered with location `to` created from string", () => {
    const to = '/go-out?search=foo#hash';

    expect(() => mountInRouter({ to })).not.toThrow();
    expect(MockHistory.push).toHaveBeenCalledWith(to);
  });

  it.each([
    [
      'with `params` and `query`',
      { name: 'a', path: '/:id', query: ['foo'] } as Route,
      { id: '1' },
      { foo: 'bar' },
      '/1?foo=bar',
    ],
    [
      'with `params`',
      { name: 'b', path: '/:id', query: ['foo'] } as Route,
      { id: '1' },
      undefined,
      '/1',
    ],
    [
      'with `query`',
      { name: 'c', path: '/home', query: ['page'] } as Route,
      undefined,
      { page: '1' },
      '/home?page=1',
    ],
    [
      'without `params` and `query`',
      { name: 'd', path: '/menu', query: ['page'] } as Route,
      undefined,
      undefined,
      '/menu',
    ],
  ])(
    "doesn't break / throw when rendered with `to` as a Route object, %s",
    (_, to, params, query, expected) => {
      expect(() => mountInRouter({ to, params, query })).not.toThrow();
      expect(MockHistory.push).toHaveBeenCalledWith(expected);
    }
  );

  it.each([
    ['string', '/cool-page', undefined, undefined, '/cool-page'],
    ['object', mockRoute, { id: '2' }, { foo: 'bar' }, '/2?foo=bar'],
  ])(
    'should navigate to given route %s correctly',
    (_, to, params, query, expected) => {
      mountInRouter({ to, query, params, push: false });
      expect(MockHistory.replace).toHaveBeenCalledWith(expected);
      expect(MockHistory.push).not.toHaveBeenCalled();
    }
  );

  it('should navigate to absolute URLs', () => {
    jest.spyOn(window.location, 'assign').mockImplementation(() => jest.fn());

    const to = 'https://www.atlassian.com';

    mountInRouter({ to });
    expect(MockHistory.replace).not.toHaveBeenCalledWith(to);
    expect(window.location.assign).toHaveBeenCalledWith(to);
  });

  it.each([
    ['string', 'pathname'],
    ['object', { name: 'a', path: 'pathname' } as Route],
  ])(
    'should not redirect if the given route %s is equivalent to current location',
    (_, to) => {
      mountInRouter({ to });

      expect(mockConsole.warn).toHaveBeenCalledWith(expect.any(String));
      expect(MockHistory.replace).not.toHaveBeenCalled();
      expect(MockHistory.push).not.toHaveBeenCalled();
    }
  );

  it.each([
    ['string', '/cool-page', undefined, '/cool-page'],
    ['object', mockRoute, { id: '3' }, '/3'],
  ])(
    'should use push history correctly with given route %s',
    (_, to, params, expected) => {
      mountInRouter({ to, params, push: true });
      expect(MockHistory.push).toHaveBeenCalledWith(expected);
      expect(MockHistory.replace).not.toHaveBeenCalled();
    }
  );
});
