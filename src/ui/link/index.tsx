import { createPath } from 'history';
import { createElement, forwardRef, useState } from 'react';

import { LinkProps, Route } from '../../common/types';
import { generateLocationFromPath } from '../../common/utils';
import { useRouterActions } from '../../controllers';

import { getValidLinkType, handleNavigation } from './utils';

const Link = forwardRef<HTMLButtonElement | HTMLAnchorElement, LinkProps>(
  (
    {
      children,
      target = '_self',
      replace = false,
      href = undefined,
      to = undefined,
      onClick = undefined,
      type: linkType = 'a',
      params,
      query,
      ...rest
    },
    ref
  ) => {
    const routerActions = useRouterActions();
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
      basePath: routerActions.getBasePath() as any,
    };
    const linkDestination = href
      ? typeof href !== 'string'
        ? createPath(href)
        : href
      : typeof to !== 'string'
      ? (route &&
          createPath(generateLocationFromPath(route.path, routeAttributes))) ||
        ''
      : to;

    const handleLinkPress = (e: any) =>
      handleNavigation(e, {
        onClick,
        target,
        replace,
        routerActions,
        href: linkDestination,
        to: route && [route, { params, query }],
      });

    return createElement(
      validLinkType,
      {
        ...rest,
        href: linkDestination,
        target,
        onClick: handleLinkPress,
        onKeyDown: handleLinkPress,
        ref,
      },
      children
    );
  }
);

Link.displayName = 'Link';

export default Link;
