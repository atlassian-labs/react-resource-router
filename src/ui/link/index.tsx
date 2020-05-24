import React, { createElement, forwardRef } from 'react';

import { createPath } from 'history';

import { LinkProps } from '../../common/types';
import { RouterActions } from '../../controllers';

import { getValidLinkType, handleNavigation } from './utils';

const Link = forwardRef<HTMLButtonElement | HTMLAnchorElement, LinkProps>(
  (
    {
      children,
      target = '_self',
      replace = false,
      href = '',
      to = '',
      onClick = undefined,
      type: linkType = 'a',
      ...rest
    },
    ref,
  ) => {
    return (
      <RouterActions>
        {({ push, replace: replaceAction }) => {
          const validLinkType = getValidLinkType(linkType);
          const linkTargetProp = href || to || '';
          const linkDestination =
            typeof linkTargetProp === 'object'
              ? createPath(linkTargetProp)
              : linkTargetProp;

          const routerActions = { push, replace: replaceAction };

          const handleLinkPress = (e: any) =>
            handleNavigation(e, {
              onClick,
              target,
              replace,
              routerActions,
              href: linkDestination,
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
            children,
          );
        }}
      </RouterActions>
    );
  },
);

Link.displayName = 'Link';

export default Link;
