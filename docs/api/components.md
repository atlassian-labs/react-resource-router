## Router

The `Router` component should ideally wrap your client app as high up in the tree as possible. As soon as it is mounted, it will match the current route and then call all of the matched resources' `getData` methods. Components that are subscribed to these resources either via the [`useResource`](./hooks.md#useresource) hook or [`ResourceSubscriber`](./components.md#resourcesubscriber) will progressively update according to the requests' lifecycles.

If you are planning to render your application on the server, we recommend creating a composition boundary between your router and the core of your application, including your `RouteComponent`.

```js
// App.js
import { RouteComponent } from 'react-resource-router';
import { Providers } from '../providers';

export const App = () => (
  <Providers>
    <RouteComponent />
  </Providers>
);
```

```js
// index.js
import { Router, createBrowserHistory } from 'react-resource-router';
import { App } from './components';
import { appRoutes } from './routing';

<Router history={createBrowserHistory()} routes={appRoutes}>
  <App />
</Router>;
```

### Router props

| prop              | type                      | description                                                                                        |
| ----------------- | ------------------------- | -------------------------------------------------------------------------------------------------- |
| `routes`          | `Routes[]`                | Your application's routes                                                                          |
| `initialRoute`    | `Route`                   | The route your application is initially showing                                                    |
| `history`         | `History`                 | The history instance for the router                                                                |
| `basePath`        | `string`                  | Base path string that will get prepended to all route paths                                        |
| `resourceContext` | `ResourceContext`         | Custom contextual data that will be provided to all your resources' `getKey` and `getData` methods |
| `resourceData`    | `ResourceData`            | Pre-resolved resource data. When provided, the router will not request resources on mount          |
| `onPrefetch`      | `function(RouterContext)` | Called when prefetch is triggered from a Link                                                      |

## StaticRouter

If you are planning to render your application on the server, you must use the `StaticRouter` in your server side entry. The `StaticRouter` should only be used on server. It does not require a `history` prop to be provided, instead, you simply need to provide the current `location` as a string. In order to achieve this, we recommend your server side application uses [`jsdom`](https://github.com/jsdom/jsdom).

```js
// server-app.js
import { StaticRouter } from 'react-resource-router';
import { App } from '../components';
import { appRoutes } from '../routing';

const { pathname, search } = window.location;
const location = `${pathname}${search}`;

export const ServerApp = () => (
  <StaticRouter routes={appRoutes} location={location}>
    <App />
  </StaticRouter>
);
```

### StaticRouter props

| prop       | type       | description                                                 |
| ---------- | ---------- | ----------------------------------------------------------- |
| `routes`   | `Routes[]` | Your application's routes                                   |
| `location` | `string`   | The string representation of the app's current location     |
| `basePath` | `string`   | Base path string that will get prepended to all route paths |

## MemoryRouter

The `MemoryRouter` component can be used for your application's unit tests.

```js
it('should send right props after render with routes', () => {
  mount(
    <MemoryRouter routes={[mockRoutes[0]]}>
      <RouterSubscriber>
        {({ history, location, routes, route, match, query }) => {
          expect(history).toEqual(mockHistory);
          expect(location).toEqual(mockLocation);
          expect(routes).toEqual(routes);
          expect(route).toEqual(
            expect.objectContaining({
              path: `/pathname`,
            })
          );
          expect(match).toBeTruthy();
          expect(query).toEqual({
            foo: 'bar',
          });

          return <div>I am a subscriber</div>;
        }}
      </RouterSubscriber>
    </MemoryRouter>
  );
});
```

### MemoryRouter props

| prop       | type       | description                                                 |
| ---------- | ---------- | ----------------------------------------------------------- |
| `routes`   | `Routes[]` | Your application's routes                                   |
| `location` | `string`   | The string representation of the app's current location     |
| `basePath` | `string`   | Base path string that will get prepended to all route paths |

## Link component

The `Link` component must be used in order to allow users to click and navigate to different pages in your app.

```js
import { Link } from 'react-resource-router';

export const LinkExample = ({ href = '/' }) => {
  const handleClick = () => console.log('click');

  return (
    <Link href={href} onClick={handleClick}>
      Link Component
    </Link>
  );
};
```

### Link props

| prop       | type                                    | description                                                                |
| ---------- | --------------------------------------- | -------------------------------------------------------------------------- |
| `target`   | `string`                                | `<a>`tag target attribute                                                  |
| `replace`  | `boolean`                               | Determines if `history.replace` should be called instead of `history.push` |
| `href`     | `string`                                | The path to navigate to                                                    |
| `to`       | `string` or `Route` or `Promise<Route>` | Links to supplied route                                                    |
| `onClick`  | `function`                              | The function to call when the component is clicked                         |
| `type`     | `string`                                | The tag type to render, `a` and `button` are supported                     |
| `params`   | `{ [key]: string }`                     | Used with `to` to generate correct path url                                |
| `query`    | `{ [key]: string }`                     | Used with `to` to generate correct query string url                        |
| `prefetch` | `false` or `hover` or `mount`           | Used to start prefetching router resources                                 |

## Redirect

You can use a `Redirect` component as a route's `component` property to create a redirect route or to redirect a user elsewhere as part of internal component business logic.

```js
import { Redirect, useResource } from 'react-resource-router';
import { userResource } from 'src/routes/resources';
import { Profile } from 'src/components/user';

export const RedirectExample = () => {
  const { data, loading, error } = useResource(userResource);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error && error.code === 403) {
    return <Redirect to="/login" />;
  }

  return <Profile data={data} />;
};
```

### Redirect props

| prop   | type                   | description                                                                          |
| ------ | ---------------------- | ------------------------------------------------------------------------------------ |
| `to`   | `Location` or `string` | Component children                                                                   |
| `push` | `boolean`              | Determines if the redirecting should use `history.push` instead of `history.replace` |

## RouteComponent

The `RouteComponent` renders a `RouteSubscriber` internally and automatically renders the current route's `component` passing it the following props, known as `RouteContext`:

### RouteComponent props

| prop       | type            | description                                 |
| ---------- | --------------- | ------------------------------------------- |
| `route`    | `Route`         | The matched route configuration object      |
| `location` | `Location`      | The current location                        |
| `query`    | `Query`         | The current query                           |
| `match`    | `Match`         | The current match                           |
| `action`   | `HistoryAction` | The history action used to get to the route |

To use the `RouteComponent` simply mount it inside the router, somewhere. Note that siblings to the `RouteComponent` will _not_ be re-rendered on route change by default.

```js
import {
  createBrowserHistory,
  Router,
  RouteComponent,
} from 'react-resource-router';
import { StaticNavigation } from '../components';
import { routes } from '../routing';

export const App = () => (
  <Router history={createBrowserHistory} routes={routes}>
    <StaticNavigation />
    <RouteComponent />
  </Router>
);
```

## RouterSubscriber

The `RouterSubscriber` is a component that is subscribed to router state changes and provides these state changes as well as other router APIs to its children via render props. If you prefer to use a hook instead of a component for this functionality, you can use the [`useRouter`](#userouter) hook.

```js
import { RouterSubscriber } from 'react-resource-router';
import { MyComponent } from './my-component';

export const MyRouteComponent = () => (
  <RouterSubscriber>
    {(routerState, routerActions) => (
      <MyComponent location={routerState.location} push={routerActions.push} />
    )}
  </RouterSubscriber>
);
```

## ResourceSubscriber

The `ResourceSubscriber` is a component that is subscribed to the state of a resource. It can be used to access resource state via render props. We only recommend using this component if you are unable to use the [`useResource`](./hooks.md#useresource) hook.

### ResourceSubscriber props

| prop       | type            | description                                |
| ---------- | --------------- | ------------------------------------------ |
| `resource` | `RouteResource` | The resource to subscribe to               |
| `options`  | `Options`       | Object containing optional `routerContext` |

```js
import { ResourceSubscriber } from 'react-resource-router';
import { Circle } from './primitives';
import { avatarResource } from '../routing/resources';

export const Avatar = () => (
  <ResourceSubscriber resource={avatarResource}>
    {({ data, loading }) => {
      const image = loading ? '' : data;

      return <Circle image={image} />;
    }}
  </ResourceSubscriber>
);
```

## RouterActions

Actions that communicate with the router's routing functionality are exposed safely via the `RouterActions` component and [`useRouterActions`](#userouteractions) hook.

By using either of these you will gain access to the following actions

| prop            | type       | arguments                                                | description                                                                                           |
| --------------- | ---------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `push`          | `function` | `path: Href, state?: any`                                | Calls `history.push` with the supplied args                                                           |
| `pushTo`        | `function` | `route: Route, attributes?: { params?: {}, query?: {} }` | Calls `history.push` generating the path from supplied route and attributes                           |
| `replace`       | `function` | `path: Href, state?: any`                                | Calls `history.replace` with the supplied args                                                        |
| `replaceTo`     | `function` | `route: Route, attributes?: { params?: {}, query?: {} }` | Calls `history.replace` generating the path from supplied route and attributes                        |
| `goBack`        | `function` |                                                          | Goes to the previous route in history                                                                 |
| `goForward`     | `function` |                                                          | Goes to the next route in history                                                                     |
| `registerBlock` | `function` | `blocker: HistoryBlocker`                                | Custom `history` API that allows you to stop a transition from happening so route changes are stopped |

Here's how you can use the component:

```js
export const RouterActionsRenderPropsExample = () => (
  <RouterActions>
    {routerActions => <MyComponent push={routerActions.push} />}
  </RouterActions>
);
```

## withRouter

The `withRouter` higher order component can be used for decorating your component. It provides the following props to its children:

### withRouter props

| prop       | type            | description                                 |
| ---------- | --------------- | ------------------------------------------- |
| `route`    | `Route`         | The matched route configuration object      |
| `location` | `Location`      | The current location                        |
| `query`    | `Query`         | The current query                           |
| `match`    | `Match`         | The current match                           |
| `action`   | `HistoryAction` | The history action used to get to the route |
| `history`  | `History`       | The router's history instance               |

We **do not recommend** using `withRouter` unless you are migrating away from `react-router`. Accessing history directly, especially in large applications, can cause side effects that are difficult to debug. For this reason it is better to either access router actions via `useRouter` or `useRouterActions`.

```js
import { withRouter } from 'react-resource-router';

export const WithRouterHocExample = withRouter(MyComponent);

const MyRouterComponent = () => {
  return <WithRouterHocExample />;
};
```
