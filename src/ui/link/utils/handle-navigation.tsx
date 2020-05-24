import { KeyboardEvent, MouseEvent } from 'react';

import { isKeyboardEvent, isModifiedEvent } from '../../../common/utils/event';

type LinkNavigationEvent = MouseEvent | KeyboardEvent;

type LinkPressArgs = {
  target?: string;
  routerActions: {
    push: (href: string) => void;
    replace: (href: string) => void;
  };
  replace: boolean;
  href: string;
  onClick?: (e: LinkNavigationEvent) => void;
};

export const handleNavigation = (
  event: any,
  { onClick, target, replace, routerActions, href }: LinkPressArgs,
): void => {
  if (isKeyboardEvent(event) && event.keyCode !== 13) {
    return;
  }

  onClick && onClick(event);

  if (
    !event.defaultPrevented && // onClick prevented default
    ((isKeyboardEvent(event) && event.keyCode === 13) || event.button === 0) && // ignore everything but left clicks and Enter key
    (!target || target === '_self') && // let browser handle "target=_blank" etc.
    !isModifiedEvent(event) // ignore clicks with modifier keys
  ) {
    event.preventDefault();
    const method = replace ? routerActions.replace : routerActions.push;
    method(href);
  }
};
