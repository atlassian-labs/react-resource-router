# How to configure the Router

The core `Router` component is configured by four props. These are the `routes`, `history`, `resourceContext` and `resourceData` props.

## Routes

The `routes` prop for the `Router` component is simply an array of route configuration objects. We recommend that you export this array from a single file or module that acts as the source of truth for all of your application's routing concerns.

Each route configuration object has a number of properties which you can set

| Property    | type                          | Description                                                                                                                                                         |
| ----------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `path`      | `string`                      | The path that will be matched for this route to render. The path can contain params which will be provided to the component on match. This property is **required** |
| `component` | `ComponentType<RouteContext>` | The component that will be rendered if the current location matches the path. This property is **required**                                                         |
| `resources` | `RouteResource[]`             | The resources that will be loaded for this route                                                                                                                    |
| `name`      | `string`                      | A way to identify the route                                                                                                                                         |
| `exact`     | `boolean`                     | Determines if the route should only be considered a match if the path is exact                                                                                      |

Here is a simple example of a routes array with two routes

```js
export const routes = [
  {
    path: '/home',
    name: 'HOME',
    component: Home,
    resources: [homeResource],
  },
  {
    path: '/about',
    name: 'ABOUT',
    component: About,
    resources: [aboutResource],
  },
];
```

## History

You must provide a `history` instance to the router. Again, this will feel familiar to users of `react-router`. Here is how to do this

```js
import {
  Router,
  RouteComponent,
  createBrowserHistory,
} from 'react-resource-router';
import { routes } from './routing';

const history = createBrowserHistory();
export const App = () => (
  <Router history={history} routes={routes}>
    <RouteComponent />
  </Router>
);
```

## ResourceContext

The `resourceContext` prop is an optional but powerful way to provide router agnostic or environment specific data to the router. It is provided to all of your resources' `getKey` and `getData` functions and can therefore be used to do more complex business logic in these scopes if required.

Here is a simple example - let's consider that we have an object that has been populated with some contextual, environment specific data

```js
import { environment } from './constants';

export const App = () => (
  <Router history={history} routes={routes} resourceContext={{ environment }}>
    <RouteComponent />
  </Router>
);
```

This `environment` object will now be accessible in our `getKey` and `getData` functions which could assist us in constructing keys or making fetch requests to the correct API endpoints.

## ResourceData

If you have rendered your app on the server, you have already fetched all the data required for the route the user has requested. The `resourceData` prop is designed to be set to avoid refetching this data again once the client side app has booted.

```js
export const App = () => (
  <Router history={history} routes={routes} resourceData={window.__SSR_STATE__}>
    <RouteComponent />
  </Router>
);
```

Here, we are assuming that your server has returned HTML with a script tag that has declared the `__SSR_STATE__` object. For more info on this please checkout [this section](#how-to-use-the-router-on-the-server) on using the router on the server.

**NOTE:** When the `resourceData` prop is set, the router will **not** request resources on mount.
