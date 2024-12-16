import { createPath } from 'history';
import {
  createElement,
  forwardRef,
  useCallback,
  useEffect,
  useState,
  MouseEvent,
  KeyboardEvent,
  FocusEvent,
} from 'react';

import { LinkProps, Route } from '../../common/types';
import {
  createRouterContext,
  generateLocationFromPath,
} from '../../common/utils';
import { useRouterStoreActions } from '../../controllers/router-store';
import { useTimeout } from '../../controllers/use-timeout';

import { getValidLinkType, handleNavigation } from './utils';

const PREFETCH_DELAY = 225;

const Link = forwardRef<HTMLButtonElement | HTMLAnchorElement, LinkProps>(
  (
    {
      children,
      target = '_self',
      replace = false,
      href = undefined,
      to = undefined,
      onClick = undefined,
      onMouseEnter = undefined,
      onMouseLeave = undefined,
      onPointerDown = undefined,
      onFocus = undefined,
      onBlur = undefined,
      type: linkType = 'a',
      params,
      query,
      prefetch = false,
      state = undefined,
      ...rest
    },
    ref
  ) => {
    const routerActions = useRouterStoreActions();
    const { schedule, cancel } = useTimeout(PREFETCH_DELAY);

    const validLinkType = getValidLinkType(linkType);
    const [route, setRoute] = useState<Route | void>(() => {
      if (to && typeof to !== 'string') {
        if ('then' in to)
          to.then(r => setRoute('default' in r ? r.default : r));
        else return to;
      }
    });

    const routeAttributes = {
      params,
      query,
      basePath: routerActions.getBasePath(),
    };
    const linkDestination =
      href != null
        ? href
        : typeof to !== 'string'
          ? (route &&
              createPath(
                generateLocationFromPath(route.path, routeAttributes)
              )) ||
            ''
          : to;
    const IS_EXTERNAL_LINK_REGEX = /^(?:(http|https):\/\/)/;
    const staticBasePath =
      (href != null && !IS_EXTERNAL_LINK_REGEX.test(href)) || typeof to === 'string' ? routeAttributes.basePath : '';

    const triggerPrefetch = useCallback(() => {
      // ignore if async route not ready yet
      if (typeof to !== 'string' && !route) return;

      const context =
        typeof to !== 'string' && route
          ? createRouterContext(route, { params, query })
          : null;
      routerActions.prefetchRoute(linkDestination, context);
      // omit params & query as already in linkDestination
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [route, linkDestination, routerActions]);

    useEffect(() => {
      if (prefetch === 'mount') {
        schedule(triggerPrefetch);
      }

      return cancel;
    }, [prefetch, schedule, cancel, triggerPrefetch]);

    const handleLinkPress = (e: MouseEvent | KeyboardEvent) =>
      handleNavigation(e, {
        onClick,
        target,
        replace,
        routerActions,
        href: linkDestination,
        to: route && [route, { params, query }],
        state,
      });

    const handleMouseEnter = (e: MouseEvent) => {
      if (prefetch === 'hover') {
        schedule(triggerPrefetch);
      }
      onMouseEnter && onMouseEnter(e);
    };

    const handleMouseLeave = (e: MouseEvent) => {
      if (prefetch === 'hover') {
        cancel();
      }
      onMouseLeave && onMouseLeave(e);
    };

    const handleFocus = (e: FocusEvent<HTMLAnchorElement>) => {
      if (prefetch === 'hover') {
        schedule(triggerPrefetch);
      }
      onFocus && onFocus(e);
    };

    const handleBlur = (e: FocusEvent<HTMLAnchorElement>) => {
      if (prefetch === 'hover') {
        cancel();
      }
      onBlur && onBlur(e);
    };

    const handlePointerDown = (e: PointerEvent) => {
      if (prefetch === 'hover') {
        cancel();
        triggerPrefetch();
      }
      onPointerDown && onPointerDown(e);
    };

    return createElement(
      validLinkType,
      {
        ...rest,
        href: `${staticBasePath}${linkDestination}`,
        target,
        onClick: handleLinkPress,
        onKeyDown: handleLinkPress,
        onMouseEnter: handleMouseEnter,
        onMouseLeave: handleMouseLeave,
        onFocus: handleFocus,
        onBlur: handleBlur,
        onPointerDown: handlePointerDown,
        ref,
      },
      children
    );
  }
);

Link.displayName = 'Link';

export default Link;
