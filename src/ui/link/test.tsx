import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { userEvent } from '@testing-library/user-event';
import React from 'react';
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

const newPath = '/my-new-path';
const eventModifiers = ['ShiftLeft', 'ControlLeft', 'AltLeft', 'MetaLeft'];

describe('<Link />', () => {
  const renderInRouter = (
    children: LinkProps['children'],
    props: Partial<LinkProps> = defaultProps,
    basePath = ''
  ) => {
    return render(
      // @ts-expect-error
      <Router basePath={basePath} history={HistoryMock} routes={[]}>
        <Link {...props}>{children}</Link>
      </Router>
    );
  };

  afterEach(() => {
    jest.resetAllMocks();
    defaultRegistry.stores.clear();
  });

  it('should render a <Link />', () => {
    renderInRouter('my link');

    const anchor = screen.getByRole('link', { name: 'my link' });
    expect(anchor).toHaveAttribute('href', defaultProps.href);
  });

  it('should support the `to` prop', () => {
    renderInRouter('my link', {
      to: newPath,
    });
    const linkElement = screen.getByRole('link', { name: 'my link' });
    expect(linkElement).toHaveAttribute('href', newPath);
  });

  it('should support the `to` prop with basePath', () => {
    renderInRouter('my link', { to: '/my-page/1?foo=bar' }, '/base');
    const linkElement = screen.getByRole('link', { name: 'my link' });
    expect(linkElement).toHaveAttribute('href', `/base/my-page/1?foo=bar`);
  });

  it('should push history with correct link given basePath', async () => {
    const user = userEvent.setup();
    renderInRouter(
      'my link',
      {
        to: '/my-page/1?foo=bar',
      },
      '/base'
    );

    await user.click(screen.getByRole('link', { name: 'my link' }));

    expect(HistoryMock.push).toHaveBeenCalledWith(
      '/base/my-page/1?foo=bar',
      undefined
    );
  });

  it('should pass props to the child element', () => {
    renderInRouter('my link', {
      ...defaultProps,
      // @ts-expect-error
      'data-qa': '.my-test-class',
    });
    const linkElement = screen.getByRole('link', { name: 'my link' });
    expect(linkElement).toHaveAttribute('data-qa', '.my-test-class');
    expect(linkElement).toHaveAttribute('href', defaultProps.href);
  });

  it('should render as a button if the type prop is `button`', () => {
    renderInRouter('my link', { type: 'button' });
    const buttonElement = screen.getByRole('button', { name: 'my link' });
    expect(buttonElement).toBeInTheDocument();
  });

  it('should render as an anchor if the type prop is neither `a` nor `button`', () => {
    // @ts-expect-error
    renderInRouter('my link', { type: 'somethingwrong' });
    const anchorElement = screen.getByRole('link', { name: 'my link' });
    expect(anchorElement).toBeInTheDocument();
  });

  it('should use `history.push` to navigate on click', async () => {
    const user = userEvent.setup();
    renderInRouter('my link', { href: newPath });

    await user.click(screen.getByRole('link', { name: 'my link' }));

    expect(HistoryMock.push).toHaveBeenCalledTimes(1);
    expect(HistoryMock.push).toHaveBeenCalledWith(newPath, undefined);
  });

  it('should call `event.preventDefault()` on navigation', () => {
    /**
     * This test will log a warning in the console we can ignore. We can't intercept the event here as we need to test.
     *
     * console.error
     *  Error: Not implemented: navigation (except hash changes)
     * type: 'not implemented
     */

    renderInRouter('my link', { href: newPath });
    const linkElement = screen.getByRole('link', { name: 'my link' });

    const mockPreventDefault = jest.fn();

    const event = new MouseEvent('click', { bubbles: true });

    event.preventDefault = mockPreventDefault;

    act(() => {
      linkElement.dispatchEvent(event);
    });

    expect(mockPreventDefault).toHaveBeenCalledTimes(1);
  });

  it('should call the `onClick` prop when it is provided', async () => {
    const user = userEvent.setup();
    const mockOnClick = jest.fn();
    renderInRouter('my link', {
      href: newPath,
      onClick: mockOnClick,
    });

    await user.click(screen.getByRole('link', { name: 'my link' }));

    expect(mockOnClick).toHaveBeenCalledTimes(1);
    expect(HistoryMock.push).toHaveBeenCalledTimes(1);
  });

  it('should use `history.replace` to navigate when `replace` is `true`', async () => {
    const user = userEvent.setup();
    renderInRouter('my link', { href: newPath, replace: true });

    await user.click(screen.getByRole('link', { name: 'my link' }));

    expect(HistoryMock.replace).toHaveBeenCalledTimes(1);
    expect(HistoryMock.replace).toHaveBeenCalledWith(newPath, undefined);
  });

  describe('preventing navigation', () => {
    Object.defineProperty(window, 'location', {
      value: {
        pathname: '/pathname',
        assign: jest.fn(),
      },
    });
    eventModifiers.forEach(modifier => {
      it(`should not navigate if the ${modifier} modifier is present`, async () => {
        const user = userEvent.setup();
        renderInRouter('my link', { href: newPath });

        const link = screen.getByRole('link', { name: 'my link' });
        // We add an event listener to prevent JSDOM from throwing an error see: https://github.com/jsdom/jsdom/issues/2112#issuecomment-663672587
        link.addEventListener('click', e => e.preventDefault(), false);

        await user.keyboard(`[${modifier}>]`);
        await user.click(link);

        expect(HistoryMock.push).not.toHaveBeenCalled();
      });
    });

    it('should not navigate if the event’s default behavior has already been prevented', async () => {
      const user = userEvent.setup();
      renderInRouter('my link', { href: newPath });

      const linkElement = screen.getByRole('link', { name: 'my link' });
      linkElement.addEventListener('click', e => e.preventDefault());
      await user.click(linkElement);

      expect(HistoryMock.push).not.toHaveBeenCalled();
    });

    it('should not navigate if the button that initiated the event was not a left-click', async () => {
      const user = userEvent.setup();
      renderInRouter('my link', { href: newPath });

      const linkElement = screen.getByRole('link', { name: 'my link' });
      await user.pointer({
        target: linkElement,
        keys: '[MouseRight]',
      });

      expect(HistoryMock.push).not.toHaveBeenCalled();
    });

    it('should allow the browser to handle navigation if the Link’s target is not `_self`', async () => {
      const user = userEvent.setup();
      renderInRouter('my link', { href: newPath, target: '_blank' });

      await user.click(screen.getByRole('link', { name: 'my link' }));

      expect(HistoryMock.push).not.toHaveBeenCalled();
    });
  });

  describe('when the link has `to` route prop defined', () => {
    const route = {
      name: 'my-page',
      path: '/my-page/:id',
      component: () => null,
    };

    it('should render the correct link', () => {
      renderInRouter(
        'my link',
        {
          to: route,
          params: { id: '1' },
          query: { foo: 'bar' },
        },
        '/base'
      );
      expect(screen.getByRole('link', { name: 'my link' })).toHaveAttribute(
        'href',
        '/base/my-page/1?foo=bar'
      );
    });

    it('should push history with correct link', async () => {
      const user = userEvent.setup();
      renderInRouter(
        'my link',
        {
          to: route,
          params: { id: '1' },
          query: { foo: 'bar' },
        },
        '/base'
      );

      await user.click(screen.getByRole('link', { name: 'my link' }));

      expect(HistoryMock.push).toHaveBeenCalledWith(
        {
          hash: '',
          pathname: '/base/my-page/1',
          search: '?foo=bar',
        },
        undefined
      );
    });

    it('should handle async route imports', async () => {
      const user = userEvent.setup();
      renderInRouter('my link', {
        to: Promise.resolve({ default: route }),
        params: { id: '1' },
        query: { foo: 'bar' },
      });
      await act(() => Promise.resolve());

      await user.click(screen.getByRole('link', { name: 'my link' }));

      expect(screen.getByRole('link', { name: 'my link' })).toHaveAttribute(
        'href',
        '/my-page/1?foo=bar'
      );
      expect(HistoryMock.push).toHaveBeenCalledWith(
        {
          hash: '',
          pathname: '/my-page/1',
          search: '?foo=bar',
        },
        undefined
      );
    });

    it('should error if required route parameters are missing', () => {
      // Mock the console error to prevent the desired error from polluting the test output
      const consoleSpy = jest.spyOn(console, 'error');
      consoleSpy.mockImplementation(() => {});

      const renderWithMissingParams = () => {
        renderInRouter('my link', { to: route });
      };
      expect(renderWithMissingParams).toThrow();

      consoleSpy.mockRestore();
    });
  });

  describe('when the link has focus, and a keypress is fired', () => {
    it('should navigate if the key was an `enter`', async () => {
      const user = userEvent.setup();
      renderInRouter('my link', { href: newPath });

      const linkElement = screen.getByRole('link', { name: 'my link' });
      linkElement.focus();
      await user.keyboard('{Enter}');

      expect(HistoryMock.push).toHaveBeenCalledTimes(1);
      expect(HistoryMock.push).toHaveBeenCalledWith(newPath, undefined);
    });

    it('should not navigate for any other key', async () => {
      const user = userEvent.setup();
      renderInRouter('my link', { href: newPath });

      const linkElement = screen.getByRole('link', { name: 'my link' });
      linkElement.focus();
      await user.keyboard('{a}');

      expect(HistoryMock.push).not.toHaveBeenCalled();
    });
  });

  describe('when styles are passed into Link, element should be rendered with styles', () => {
    it('should add style to button when creating `button`', () => {
      renderInRouter('my link', {
        type: 'button',
        style: { color: 'yellow' },
      });
      const buttonElement = screen.getByRole('button', { name: 'my link' });
      expect(buttonElement).toHaveStyle('color: yellow');
    });

    it('should add style to anchor when creating `a`', () => {
      renderInRouter('my link', {
        to: 'abc',
        style: { color: 'yellow' },
      });
      const anchorElement = screen.getByRole('link', { name: 'my link' });
      expect(anchorElement).toHaveStyle('color: yellow');
    });
  });
});
