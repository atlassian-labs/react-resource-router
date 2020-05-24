export const mockLocation = {
  pathname: 'pathname',
  search: 'search',
  hash: 'hash',
};

export const mockMatch = {
  params: {},
  isExact: false,
  path: '',
  url: '',
  query: {},
};

export const mockQuery = {};

export const mockAction = 'PUSH';

export const mockRoute = {
  path: '/pathname',
  name: 'mocked-route',
  component: () => null,
};

export const mockRoutes = [
  mockRoute,
  { ...mockRoute, path: '/a', name: 'mocked-route-a' },
  { ...mockRoute, path: '/b', name: 'mocked-route-b' },
];

export const mockMatchedRoute = {
  route: mockRoute,
  match: mockMatch,
};

export const mockRouteContext = {
  route: mockRoute,
  location: mockLocation,
  query: mockQuery,
  action: mockAction,
  match: mockMatch,
};

export const mockRouterActions = {
  registerBlock: () => () => null,
  push: () => () => null,
  replace: () => () => null,
  goBack: () => () => null,
  goForward: () => () => null,
};

export const mockRouteResourceResponse = {
  loading: false,
  error: null,
  data: { foo: 'bar' },
  promise: null,
  expiresAt: Date.now(),
};

export const mockRouterStoreContext = {
  route: mockRoute,
  location: { pathname: '', search: '', hash: '' },
  query: mockQuery,
  match: mockMatch,
};

export const mockRouteContextProp = (key: string, mock: Object) => ({
  ...mockRouteContext,
  // @ts-ignore
  [key]: { ...mockRouteContext[key], ...mock },
});

export const mockRouterStoreContextProp = (key: string, mock: Object) => ({
  ...mockRouterStoreContext,
  // @ts-ignore
  [key]: { ...mockRouterStoreContext[key], ...mock },
});
