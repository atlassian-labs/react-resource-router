import noop from 'lodash.noop';

import { createLegacyHistory } from './utils/history';

export const DEFAULT_LOCATION = { pathname: '', search: '', hash: '' };
export const DEFAULT_MATCH = {
  params: {},
  isExact: false,
  path: '',
  url: '',
  query: {},
};
export const DEFAULT_ROUTE = {
  path: '',
  component: () => null,
  name: '',
};
export const DEFAULT_HISTORY = createLegacyHistory();
export const NOOP_HISTORY = {
  location: DEFAULT_LOCATION,
  push: noop,
  replace: noop,
  goBack: noop,
  goForward: noop,
  listen: noop,
  block: noop,
  createHref: noop,
};

export const DEFAULT_ACTION = 'POP';

export const DEFAULT_PREFETCH_DELAY = 300;
