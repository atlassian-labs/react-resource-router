import { createPath } from 'history';
import debounce from 'lodash.debounce';
import noop from 'lodash.noop';

import { BrowserHistory, Location } from '../../types';

type HistoryAction = 'POP' | 'PUSH' | 'REPLACE';
type Listener = (location: Location, action: HistoryAction) => void;

const hasWindow = () => typeof window !== 'undefined';

const methodsPlaceholders = {
  push: noop,
  replace: noop,
  goBack: noop,
  goForward: noop,
  listen: () => noop,
  block: () => noop,
};

const getLocation = () => {
  // todo - don't force non-optional search and hash
  const {
    pathname = '',
    search = '',
    hash = '',
  } = (hasWindow() && window.location) || {};

  return { pathname, search, hash };
};

const createLegacyListener = (updateExposedLocation: Listener) => {
  const node = document.querySelector('#content');
  let prevHref = window.location.href;
  let listeners: Listener[] = [];
  const historyStack = [prevHref];
  // note: window.history.length is capped at 50 entries
  let prevHistoryLength = window.history.length;
  let historyIndex = 0;
  const getAction = (): HistoryAction => {
    const currentHref = window.location.href;
    if (prevHistoryLength === window.history.length) {
      if (historyStack[historyIndex - 1] === currentHref) {
        historyIndex -= 1;

        return 'POP';
      }
      if (historyStack[historyIndex + 1] === currentHref) {
        historyIndex += 1;

        return 'POP';
      }
      historyStack[historyStack.length - 1] = currentHref;

      return 'REPLACE';
    }
    historyStack.push(currentHref);
    historyIndex += 1;
    prevHistoryLength = window.history.length;

    return 'PUSH';
  };
  const onNodeChanges = debounce(() => {
    if (prevHref !== window.location.href) {
      const newLocation = getLocation();
      const action = getAction();
      updateExposedLocation(newLocation, action);

      listeners.forEach(listener => listener(newLocation, action));
      prevHref = window.location.href;
    }
  }, 50);

  if (node) {
    const observer = new window.MutationObserver(onNodeChanges);
    observer.observe(node, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true,
    });
  }

  return (listener: any) => {
    listeners = listeners.concat(listener);

    return () => {
      listeners = listeners.filter(lst => lst !== listener);
    };
  };
};

export const createLegacyHistory = (): BrowserHistory => {
  let currentLocation = getLocation();
  let currentAction: HistoryAction = 'PUSH';
  const updateExposedLocation: Listener = (v, a) => {
    currentLocation = v;
    currentAction = a;
  };

  return {
    get location() {
      return currentLocation;
    },
    get length() {
      return hasWindow() ? window.history.length : 1; // default length is 1
    },
    get action() {
      return currentAction;
    },
    ...(hasWindow()
      ? {
          push: (path: string | Location) =>
            window.location.assign(
              typeof path === 'string' ? path : createPath(path || {})
            ),
          replace: (path: string | Location) =>
            window.history.replaceState(
              {},
              document.title,
              typeof path === 'string' ? path : createPath(path || {})
            ),
          goBack: () => window.history.back(),
          goForward: () => window.history.forward(),
          listen: createLegacyListener(updateExposedLocation),
          block: () => noop,
          createHref: (location: Location) => createPath(location),
        }
      : methodsPlaceholders),
  };
};
