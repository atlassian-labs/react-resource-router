import React from 'react';

import { mount } from 'enzyme';
import { defaultRegistry } from 'react-sweet-state';

import { Redirect } from '../../../../controllers/redirect';
import { RedirectProps } from '../../../../controllers/redirect/types';
import { Router } from '../../../../controllers/router';

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
  listen: jest.fn(),
  createHref: jest.fn(),
  location: MockLocation,
  _history: jest.fn(),
};

const defaultArgs = {
  to: '',
  push: true,
};

const mockConsole = { ...global.console, warn: jest.fn() };

describe('Redirect', () => {
  const mountInRouter = (args: Partial<RedirectProps>) =>
    mount(
      // @ts-ignore
      <Router history={MockHistory} routes={[]}>
        <Redirect {...defaultArgs} {...args} />
      </Router>
    );

  let globalConsole: any;

  const { location } = window;

  beforeAll(() => {
    delete window.location;
    // @ts-ignore
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

  it('should navigate to given route correctly', () => {
    const to = '/cool-page';

    mountInRouter({ to, push: false });
    expect(MockHistory.replace).toHaveBeenCalledWith(to);
    expect(MockHistory.push).not.toHaveBeenCalled();
  });

  it('should navigate to absolute URLs', () => {
    jest.spyOn(window.location, 'assign').mockImplementation(() => jest.fn());

    const to = 'https://www.atlassian.com';

    mountInRouter({ to });
    expect(MockHistory.replace).not.toHaveBeenCalledWith(to);
    expect(window.location.assign).toHaveBeenCalledWith(to);
  });

  it('should not redirect if the location is equivalent to current', () => {
    mountInRouter({ to: 'pathname' });

    expect(mockConsole.warn).toHaveBeenCalledWith(expect.any(String));
    expect(MockHistory.replace).not.toHaveBeenCalled();
    expect(MockHistory.push).not.toHaveBeenCalled();
  });

  it('should use push history correctly', () => {
    const to = '/cool-page';

    mountInRouter({ to, push: true });
    expect(MockHistory.push).toHaveBeenCalledWith(to);
    expect(MockHistory.replace).not.toHaveBeenCalled();
  });
});
