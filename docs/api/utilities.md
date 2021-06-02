## createResource

This function is what must be used to create resources for your routes. You can read more about how to create resources [here](../resources/creation.md).

## createBrowserHistory

This function creates a `BrowserHistory` instance. You will need to supply this to your [`Router`](./components.md#router) in your client side code. Note that a single history instance _can_ be shared between routers if you are migrating away from `react-router`.

```js
import {
  createBrowserHistory,
  RouteComponent,
  Router,
} from 'react-resource-router';
import { appRoutes } from './routing';

const history = createBrowserHistory();

export const App = () => (
  <Router history={history} routes={routes}>
    <RouteComponent />
  </Router>
);
```

## createRouterContext

Utility to create custom router contexts to be passed to resources.

```js
import { myRoute } from '../routing';

const options = {
  params: { id: '1' },
  query: { order: 'asc' },
  basePath: '/base',
};

const routerContext = createRouterContext(myRoute, options);
```

## matchRoute

If you ever need to match the current route outside of the router itself, you can use this function. This may be required if you have any other app functionality that needs route context outside of the React lifecycle.

```js
import { appRoutes } from '../routing';

const basePath = '/base';
const { pathname, search } = window.location;
const matchedRoute = matchRoute(routes, pathname, search, basePath);
```
