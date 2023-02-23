import { mount } from 'enzyme';
import React from 'react';
import { act } from 'react-dom/test-utils';
import { defaultRegistry } from 'react-sweet-state';

import { LinkProps } from '../../common/types';
import { Router } from '../../controllers/router';

import Link from './index';

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
  listen: () => jest.fn(),
  block: jest.fn(),
  createHref: jest.fn(),
  location: MockLocation,
};

const defaultProps = {
  href: '/my-link',
};

const baseClickEvent = {
  preventDefault: jest.fn(),
  button: 0,
};

const newPath = '/my-new-path';
const eventModifiers = [['metaKey'], ['altKey'], ['ctrlKey'], ['shiftKey']];

// https://github.com/facebook/jest/pull/5267#issuecomment-356605468
const withoutConsoleError = (fn: () => void) => () => {
  const consoleError = jest
    .spyOn<Console, 'error'>(console, 'error')
    .mockImplementation(() => undefined);
  fn();
  consoleError.mockRestore();
};

describe('<Link />', () => {
  const mountInRouter = (
    children: LinkProps['children'],
    props: Partial<LinkProps> = defaultProps,
    basePath = ''
  ) =>
    mount(
      // @ts-expect-error
      <Router basePath={basePath} history={HistoryMock} routes={[]}>
        <Link {...props}>{children}</Link>
      </Router>
    );

  afterEach(() => {
    jest.resetAllMocks();
    defaultRegistry.stores.clear();
  });

  it('should render a <Link />', () => {
    const wrapper = mountInRouter('my link');
    const anchor = wrapper.find('a');

    expect(anchor.prop('href')).toEqual(defaultProps.href);
  });

  it('should support the `to` prop', () => {
    const wrapper = mountInRouter('my link', {
      to: newPath,
    });
    const anchor = wrapper.find('a');

    expect(anchor.prop('href')).toEqual(newPath);
  });

  it('should pass props to the child element', () => {
    const wrapper = mountInRouter('my link', {
      ...defaultProps,
      // @ts-expect-error
      'data-qa': '.my-test-class',
    });
    const component = wrapper.find('a');

    expect(component).toHaveLength(1);
    expect(component.prop('data-qa')).toEqual('.my-test-class');
    expect(component.prop('href')).toEqual(defaultProps.href);
  });

  it('should render as a button if the type prop is `button`', () => {
    const wrapper = mountInRouter('my link', { type: 'button' });
    const component = wrapper.find('button');

    expect(component).toHaveLength(1);
  });

  it('should render as an anchor if the type prop is neither `a` nor `button`', () => {
    // @ts-expect-error
    const wrapper = mountInRouter('my link', { type: 'somethingwrong' });
    const component = wrapper.find('a');

    expect(component).toHaveLength(1);
  });

  it('should use `history.push` to navigate on click', () => {
    const wrapper = mountInRouter('my link', { href: newPath });
    const component = wrapper.find('Link');

    component.simulate('click', baseClickEvent);

    expect(HistoryMock.push).toHaveBeenCalledTimes(1);
    expect(HistoryMock.push).toHaveBeenCalledWith(newPath);
  });

  it('should call `event.preventDefault() on navigation`', () => {
    const wrapper = mountInRouter('my link', { href: newPath });
    const component = wrapper.find('Link');

    component.simulate('click', baseClickEvent);

    expect(baseClickEvent.preventDefault).toHaveBeenCalledTimes(1);
  });

  it('should call the `onClick` prop when it is provided', () => {
    const mockOnClick = jest.fn();
    const wrapper = mountInRouter('my link', {
      href: newPath,
      onClick: mockOnClick,
    });
    const component = wrapper.find('Link');

    component.simulate('click', baseClickEvent);

    expect(mockOnClick).toHaveBeenCalledTimes(1);
    expect(baseClickEvent.preventDefault).toHaveBeenCalledTimes(1);
    expect(HistoryMock.push).toHaveBeenCalledTimes(1);
  });

  it('should use `history.replace` to navigate when `replace` is `true`', () => {
    const wrapper = mountInRouter('my link', { href: newPath, replace: true });
    const component = wrapper.find('Link');

    component.simulate('click', baseClickEvent);

    expect(HistoryMock.replace).toHaveBeenCalledTimes(1);
    expect(HistoryMock.replace).toHaveBeenCalledWith(newPath);
  });

  describe('preventing navigation', () => {
    it.each(eventModifiers)(
      'should not navigate if the %i modifier is present',
      modifier => {
        const wrapper = mountInRouter('my link', { href: newPath });
        const component = wrapper.find('Link');

        component.simulate('click', { ...baseClickEvent, [modifier]: true });

        expect(HistoryMock.push).toHaveBeenCalledTimes(0);
      }
    );

    it('should not navigate if the events default behaviour has already been prevented', () => {
      const wrapper = mountInRouter('my link', { href: newPath });
      const component = wrapper.find('Link');

      component.simulate('click', {
        ...baseClickEvent,
        defaultPrevented: true,
      });

      expect(HistoryMock.push).toHaveBeenCalledTimes(0);
    });

    it('should not navigate if the button that initiated the event was not a left-click', () => {
      const wrapper = mountInRouter('my link', { href: newPath });
      const component = wrapper.find('Link');

      component.simulate('click', { ...baseClickEvent, button: 42 });

      expect(HistoryMock.push).toHaveBeenCalledTimes(0);
    });

    it('should allow the browser to handle navigation if the Links target is not `_self`', () => {
      const wrapper = mountInRouter('my link', {
        href: newPath,
        target: '_blank',
      });
      const component = wrapper.find('Link');

      component.simulate('click', baseClickEvent);

      expect(HistoryMock.push).toHaveBeenCalledTimes(0);
    });
  });

  describe('when the link has `to` route prop defined', () => {
    const route = {
      name: 'my-page',
      path: '/my-page/:id',
      component: () => null,
    };

    it('should render the correct link', () => {
      const wrapper = mountInRouter(
        'my link',
        {
          to: route,
          params: { id: '1' },
          query: { foo: 'bar' },
        },
        '/base'
      );

      expect(wrapper.html()).toEqual(
        '<a href="/base/my-page/1?foo=bar" target="_self">my link</a>'
      );
    });

    it('should push history with correct link', () => {
      const wrapper = mountInRouter(
        'my link',
        {
          to: route,
          params: { id: '1' },
          query: { foo: 'bar' },
        },
        '/base'
      );
      const component = wrapper.find('Link');

      component.simulate('click', baseClickEvent);

      expect(HistoryMock.push).toHaveBeenCalledTimes(1);
      expect(HistoryMock.push).toHaveBeenCalledWith({
        hash: '',
        pathname: '/base/my-page/1',
        search: '?foo=bar',
      });
    });

    it('should handle async route imports', async () => {
      const wrapper = mountInRouter('my link', {
        to: Promise.resolve({ default: route }),
        params: { id: '1' },
        query: { foo: 'bar' },
      });
      await act(() => Promise.resolve());
      const component = wrapper.find('Link');

      component.simulate('click', baseClickEvent);

      expect(wrapper.html()).toEqual(
        '<a href="/my-page/1?foo=bar" target="_self">my link</a>'
      );
      expect(HistoryMock.push).toHaveBeenCalledTimes(1);
      expect(HistoryMock.push).toHaveBeenCalledWith({
        hash: '',
        pathname: '/my-page/1',
        search: '?foo=bar',
      });
    });

    it('should error if required route parameters are missing', () => {
      expect(
        withoutConsoleError(() => {
          mountInRouter('my link', { to: route });
        })
      ).toThrow();
    });
  });

  describe('when the link has focus, and a keypress is fired', () => {
    it('should navigate if the key was an `enter`', () => {
      const wrapper = mountInRouter('my link', { href: newPath });
      const component = wrapper.find('Link');

      component.simulate('click', {
        ...baseClickEvent,
        type: 'keypress',
        keyCode: 13,
      });

      expect(HistoryMock.push).toHaveBeenCalledTimes(1);
      expect(HistoryMock.push).toHaveBeenCalledWith(newPath);
    });

    it('should not navigate for any other key', () => {
      const wrapper = mountInRouter('my link', { href: newPath });
      const component = wrapper.find('Link');

      component.simulate('click', {
        ...baseClickEvent,
        type: 'keypress',
        keyCode: 10,
      });

      expect(HistoryMock.push).toHaveBeenCalledTimes(0);
    });
  });

  describe('when styles are passed into Link, element should be rendered with styles', () => {
    it('should add style to button when creating `button`', () => {
      const wrapper = mountInRouter('my link', {
        type: 'button',
        style: { color: 'yellow' },
      });
      const component = wrapper.find('button');
      expect(component.props()).toMatchObject({ style: { color: 'yellow' } });
    });

    it('should add style to anchor when creating `a`', () => {
      const wrapper = mountInRouter('my link', {
        to: 'abc',
        style: { color: 'yellow' },
      });
      const anchor = wrapper.find('a');
      expect(anchor.props()).toMatchObject({ style: { color: 'yellow' } });
    });
  });
});
