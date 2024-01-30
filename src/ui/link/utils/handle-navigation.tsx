import { KeyboardEvent, MouseEvent } from 'react';

import { Route } from '../../../common/types';
import { isKeyboardEvent, isModifiedEvent } from '../../../common/utils/event';

type LinkNavigationEvent = MouseEvent | KeyboardEvent;

type LinkPressArgs = {
  target?: string;
  routerActions: {
    push: (href: string, state?: unknown) => void;
    replace: (href: string, state?: unknown) => void;
    pushTo: (route: Route, attributes: any, state?: unknown) => void;
    replaceTo: (route: Route, attributes: any, state?: unknown) => void;
  };
  replace: boolean;
  href: string;
  onClick?: (e: LinkNavigationEvent) => void;
  to: [Route, any] | void;
  state?: unknown;
};

export const handleNavigation = (
  event: any,
  { onClick, target, replace, routerActions, href, to, state }: LinkPressArgs
): void => {
  if (isKeyboardEvent(event) && event.key === 'Enter') {
    return;
  }

  onClick && onClick(event);

  if (
    !event.defaultPrevented && // onClick prevented default
    ((isKeyboardEvent(event) && event.key === 'Enter') || event.button === 0) && // ignore everything but left clicks and Enter key
    (!target || target === '_self') && // let browser handle "target=_blank" etc.
    !isModifiedEvent(event) // ignore clicks with modifier keys
  ) {
    event.preventDefault();
    if (to) {
      const method = replace ? routerActions.replaceTo : routerActions.pushTo;
      method(...to, state);
    } else {
      const method = replace ? routerActions.replace : routerActions.push;
      method(href, state);
    }
  }
};
