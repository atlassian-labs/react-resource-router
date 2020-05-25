# React Resource Router

React Resource Router (RRR) is a configuration driven routing solution for React that manages single page application route matching, data fetching and progressive rendering.

<!-- toc -->

- [Why?](#why)
  - [Features](#features)
- [Usage](#usage)
  - [Create your resources](#create-your-resources)
  - [Create your components](#create-your-components)
  - [Create your routes](#create-your-routes)
  - [Use the Router](#use-the-router)
- [Installation](#installation)
- [Examples](#examples)
- [Documentation](#documentation)
  - [Resources](#resources)
  - [Router](#router)
  - [API](#api)

<!-- tocstop -->

## Why?

React Resource Router was developed by Atlassian for [Jira](https://www.atlassian.com/software/jira) primarily to improve **performance** and prepare for **compatibility** with React's forthcoming [Concurrent Mode](https://reactjs.org/docs/concurrent-mode-intro.html) on both client and server.

### Features

- Fully driven by a static configuration of route objects
- Each route object contains the following core properties
  - `path` - the path to match
  - `component` - the component to render
  - `resources` - an array of objects containing fetch functions that request the route component's data
- Data for a route is requested **as early as possible**, with the page progressively rendering as the requests resolve. This results in quicker meaningful render times
- Works on both client and server without having to traverse the React tree

## Usage

### Create your resources

Resources describe and provide the data required for your route. This data is safely stored and accessed via the `useResource` hook or `ResourceSubscriber` component.

```js
import { createResource } from 'react-resource-router';
import { fetch } from '../common/utils';

export const homeResource = createResource({
  type: 'HOME',
  getKey: () => 'home-resource-key',
  getData: () => fetch('https://my-api.com/home'),
});

export const aboutResource = createResource({
  type: 'ABOUT',
  getKey: () => 'about-resource-key',
  getData: () => fetch('https://my-api.com/about'),
});
```

### Create your components

These are the React components that get rendered for your routes. As mentioned, they can be wired into the state of your resources via the `useResource` hook or `ResourceSubscriber` component.

```js
import { useResource } from 'react-resource-router';
import { aboutResource, homeResource } from '../routes/resources';
import { Loading, Error } from './common';

export const Home = () => {
  const [{ data, loading, error }] = useResource(homeResource);

  if (error) {
    return <Error error={error} />;
  }

  if (loading) {
    return <Loading />;
  }

  return <div>{data.home.content}</div>;
};

export const About = () => {
  const [{ data, loading, error }] = useResource(aboutResource);

  if (error) {
    return <Error error={error} />;
  }

  if (loading) {
    return <Loading />;
  }

  return <div>{data.about.content}</div>;
};
```

### Create your routes

Your route configuration is the single source of truth for your application's routing concerns.

```js
import { Home, About } from '../components';
import { homeResource, aboutResource } from './resources';

export const appRoutes = [
  {
    name: 'home',
    path: '/',
    exact: true,
    component: Home,
    resources: [homeResource],
  },
  {
    name: 'about',
    path: '/about',
    exact: true,
    component: About,
    resources: [aboutResource],
  },
];
```

### Use the Router

Now that you've set up your resources, components and configuration correctly, all you need to do is mount the Router in your react tree with a `RouteComponent` as a child. It will do the rest!

```js
import {
  Router,
  RouteComponent,
  createBrowserHistory,
} from 'react-resource-router';
import { appRoutes } from './routing/routes';

const App = () => (
  <Router routes={appRoutes} history={createBrowserHistory()}>
    <RouteComponent />
  </Router>
);
```

## Installation

```bash
npm install react-resource-router

# or

yarn add react-resource-router
```

## Examples

- [Basic routing](https://codesandbox.io/s/react-resource-router-basic-routing-example-5rch8)
- [Adding resources](https://codesandbox.io/s/react-resource-router-basic-routing-with-resources-example-lqm0m)

## Documentation

### Resources

#### What are router resources?

Router resources are objects that are used by the router to fetch, cache and provide data for route components.

You can create these objects using the [`createResource`](#how-to-create-resources) function and then put them in the `resources` array on your route configuration object. Doing so means that each resources' data will be fetched as soon as the Router is mounted on initial page loads and on route transitions if the resources have expired.

Since we recommend that your [`Router`](#router) sits as high up in your React tree as possible, it means that asynchronous requests for data are triggered as early as can be. This results in quicker meaningful render times.

#### How to create resources

Resources should always be created using the `createResource` helper function like so

```js
import { createResource } from 'react-resource-router';

export const userProfileResource = createResource({
  type: 'USER_PROFILE',
  getKey: () => 'username',
  getData: ({ user }) => fetch('https://my-app.com/api?user=username'),
});
```

`createResource` takes in a configuration object that should contain the following properties.

| Property        | type                                               | Description                                                                                                                                                                                                                                                                                                                          |
| --------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `type`          | `string`                                           | Used as a namespace for this resource. Each resource should have a unique type                                                                                                                                                                                                                                                       |
| `getKey`        | `(routerContext, resourceContext) => string`       | The return value of this function is used to identify this resource within the `type` namespace. The function itself is supplied with `routerContext` and `resourceContext` so that the composition of keys can use this data if required                                                                                            |
| `getData`       | `(routerContext, resourceContext) => Promise<any>` | This function is used to load the data for the resource. The function should return a promise and resolve with the resource data object. NOTE: You may not use `getData` and `getDataLoader` on the same resource                                                                                                                    |
| `maxAge`        | `number`                                           | How long (in milliseconds) the resource should be kept in the router before a fresh resource is retrieved. Note: resources are only refreshed on route _change_. The router does not poll or update resources in the background. Navigation within the same route, e.g. query param change, will not trigger a refresh of resources. |
| `getDataLoader` | `() => Promise<{default: getData}>`                | Optional property that enables neater code splitting. See more below. NOTE: You may not use `getData` and `getDataLoader` on the same resource                                                                                                                                                                                       |

##### Code splitting with `getDataLoader`

Code that is used to retrieve data can be asynchronously imported using the `getDataLoader` resource
property. This can be handy if your data fetching functions have a lot of dependencies meaning that they would bloat your main bundle size if imported synchronously.

The module that is imported through `getDataLoader` must export a default property that is the
function we use to load data.

**NOTE!** you cannot have both `getData` and `getDataLoader` on the same resource.

##### How to handle errors in `getData`

It is worth noting that how you handle errors in `getData` can have subtle effects.

```js
import { MyCustomError } from '../common/errors';
import { getAccountInfoData } from '../api';

// Example of a getData function that is used to retrieve account info
const getData = async (routerContext, resourceContext) => {
  const { query } = routerContext;
  // assuming isAdmin has been provided to the router as static resourceContext
  const { isAdmin } = resourceContext;

  if (!isAdmin) {
    // NOT RECOMMENDED:
    // The resource slice will take the shape: `{data: {}, error: null, loading: false}`
    // You should consider throwing an error here to ensure `data` remains `null`
    return Promise.resolve({});
  }

  const data = getAccountInfoData(isAdmin, query);

  if (!data) {
    // BETTER IMPLEMENTATION:
    // The resource state will take on the shape:  `{data: {errorCode: 'some error'}', error: null, loading: false}`
    // Only consider this pattern if your component is checking `data` for an errorCode property
    return { errorCode: 'some error' };
  }

  if (!data) {
    // RECOMMENDED IMPLEMENTATION:
    // The resource state will take the shape:  `{data: null, error: MyCustomError, loading: false}`
    throw new MyCustomError('bad thing happen');
  }

  return data;
};
```

#### How to add resources to your route

Adding resources to your route is as simple as importing them in your app routes file and adding them to the `resources` array for the route they are required for.

For example:

```js
// app-routes.js
import { accountInfoResource, avatarResource } from './resources';
import { UserProfile } from '../components';

export const routes = [
  {
    path: '/user/profile/:id',
    component: UserProfile,
    resources: [accountInfoResource, avatarResource],
  },
];
```

Here we have two resources being used for the dynamic user profile route. When the router mounts and matches this route, the `resources` here will all begin to fetch their data and the `UserProfile` component will be updated accordingly if it uses the `useResource` hook or `ResourceSubscriber` component internally.

#### How to use resources in your components

Resources expose properties and functions via the `useResource` hook or the `ResourceSubscriber`, which allow their current state to be accessed or interacted with in your components. These are

| Property  | Type       | Description                                                                             |
| --------- | ---------- | --------------------------------------------------------------------------------------- |
| `data`    | `any`      | The result which your getData function will resolve with                                |
| `loading` | `boolean`  | Determines if the resource is fetching its data or not                                  |
| `error`   | `object`   | error                                                                                   | null | If your getData function throws an error, it will be stored here |
| `update`  | `function` | Allows you to imperatively update the resource's current state bypassing its `maxAge`   |
| `refresh` | `function` | Allows you to imperatively refresh the resource's state by calling its `getData` method |

You can use these properties and functions to implement your own customised render logic inside your resource consuming components.

##### Using resources via the `useResource` hook

Using resources via the `useResource` hook is the **recommended** way to access your current resource state in a component. Here is an example of how you can do that

```js
import { useResource } from 'react-resource-router';
import { avatarResource } from '../routing/resources';
import { Circle } from './primitives';

export const Avatar = () => {
  const [{ data, loading }] = useResource(avatarResource);
  const image = loading ? '' : data;

  return <Circle image={image} />;
};
```

##### Using resources via the `ResourceSubscriber` component

If you are unable to use the `useResource` hook for whatever reason, you can also use the `ResourceSubscriber` component which provides your resource state via render props

```js
import { ResourceSubscriber } from 'react-resource-router';
import { avatarResource } from '../routing/resources';
import { Circle } from './primitives';

export class Avatar extends Component {
  render() {
    <ResourceSubscriber>
      {({ data, loading }) => {
        const [{ data, loading }] = useResource(avatarResource);
        const image = loading ? '' : data;

        return <Circle image={image} />;
      }}
    </ResourceSubscriber>;
  }
}
```

#### How to interact with resources

After the Router has mounted, your data has been fetched and your route component has rendered, you may need to interact with your resources in order to keep them up to date or to have them respond to certain user actions. In order to achieve this, in addition to the current resource state, both the `useResource` hook and `ResourceSubscriber` provide `update` and `refresh` functions for you to use in your components. Let's take a look at how these work.

##### Updating resources

The `update` method takes a callback function as a parameter, which will be called with the current state of the resource and should return the updated state.

Calling this function will replace the data property of the resource and set the `expiresAt` value, according the to the `maxAge` of the resource.

```js
import { useResource } from 'react-resource-router';
import { accountInfoResource } from '../routing/resources';

export const UsernameUpdater = ({ newUsername }) => {
  const [{ update }] = useResource(accountInfoResource);
  const updateUsername = () =>
    update(currentData => ({
      ...currentData,
      username: newUsername,
    }));

  return (
    <button onClick={updateUsername}>
      Update your username to {newUsername}
    </button>
  );
};
```

##### Refreshing resources

The refresh function is bound to the resource that you provide to `useResource` or the `ResourceSubscriber`. Calling this function will cause the router to call the `getData` function on your resource, and bypass any `expiresAt` checks.

When using the `refresh` function, the resource will always be fetched from remote and the resource state will be updated with any result, including errors.

```js
import { useResource } from 'react-resource-router';
import { accountInfoResource } from '../routing/resources';

export const UsernameResetter = ({ newUsername }) => {
  const [{ data, refresh }] = useResource(accountInfoResource);

  return (
    <button onClick={() => refresh()}>
      Reset your username to {data.username}
    </button>
  );
};
```

### Router

#### Which Router should I use?

React Resource Router provides three kinds of routers which should be quite familiar to anyone who has used `react-router` previously. These are the core [`Router`](#router-component), the [`StaticRouter`](#staticrouter-component) for use on the server and the [`MemoryRouter`](#memoryrouter-component) for use in tests. Please check the [API](#api) docs for more detailed information about these components.

#### How to configure the Router

The core `Router` component is configured by four props. These are the `routes`, `history`, `resourceContext` and `resourceData` props.

##### Routes

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

##### History

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

##### ResourceContext

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

##### ResourceData

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

#### How to access current router state

Current router state is accessible through the [`useRouter`](#userouter) hook, the [`RouterSubscriber`](#routersubscriber-component) component or the [`withRouter`](#withrouter) higher order component. We recommend using the hook or subscriber, as the HoC is provided in order to assist in migrating away from `react-router` if this is needed.

#### How to safely interact with history and the browser's location

In order to imperatively change routes in your application, for example directing the user to the `login` page after they have hit the `logout` button, you can use the [`useRouterActions`](#userouteractions) hook or the [`RouterActions`](#routeractions) component. These both expose a number of methods to safely allow you to do this without providing direct access to the router's internal `history` instance.

#### How to use the router in a server side rendered app

RRR supports server side rendered apps out of the box. If this is something that you would like to take advantage of, there are a few things we encourage you to think about first

##### Tree Composition

Universally (on both client and server), we recommend using the following tree composition pattern

```js
import { App } from './components';

<Router>
  <App />
</Router>;
```

Where `App` contains the `RouteComponent` as a child

```js
// App.js
import { RouteComponent } from 'react-resource-router';

export const App = () => (
  <>
    <RouteComponent />
  </>
);
```

The reason for this is that currently, you will need to use the [`Router`](#router-component) component on the client and the [`StaticRouter`](#staticrouter-component) component on the server. Following the above composition pattern will allow you to use the correct router in your server side entry and client side entry respectively. This could look something like the following examples:

```js
// server-app.js
import { StaticRouter } from 'react-resource-router';
import { App } from '../components';

export const ServerApp = ({ location, routes }) => (
  <StaticRouter routes={routes} location={location}>
    <App />
  </StaticRouter>
);
```

```js
// client-app.js
import { Router, createBrowserHistory } from 'react-resource-router';
import { App } from '../components';
import { routes } from '../routing/routes';

export const ClientApp = () => (
  <Router routes={routes} history={createBrowserHistory()}>
    <App />
  </Router>
);
```

##### Request all resources before rendering

Until React Suspense works on the server, we cannot do progressive rendering server side. To get around this, we need to `await` all resource requests to render our app _with all our resource data_ on the server.

Luckily the `StaticRouter` provides a convenient static method to do this for us.

```js
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-resource-router';
import { routes } from '../routing/routes';
import { ServerApp } from './app';

const renderToStringWithData = async ({ location }) => {
  await StaticRouter.requestResources({ location, routes });

  return renderToString(<ServerApp routes={routes} location={location} />);
};
```

Notice that we do not need to provide any `resourceData` object to the `ServerApp`,the `StaticRouter` handles this for us internally.

### API

#### Components

##### Router component

The `Router` component should ideally wrap your client app as high up in the tree as possible. As soon as it is mounted, it will match the current route and then call all of the matched resources' `getData` methods. Components that are subscribed to these resources either via the `useResource` hook or `ResourceSubscriber` will progressively update according to the requests' lifecycles.

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

###### Router component props

| prop              | type              | description                                                                                        |
| ----------------- | ----------------- | -------------------------------------------------------------------------------------------------- |
| `routes`          | `Routes[]`        | Your application's routes                                                                          |
| `history`         | `History`         | The history instance for the router                                                                |
| `resourceContext` | `ResourceContext` | Static contextual data that will be provided to all your resources' `getKey` and `getData` methods |
| `resourceData`    | `ResourceData`    | Pre-resolved resource data. When provided, the router will not request resources on mount          |

##### StaticRouter component

If you are planning to render your application on the server, you must use the `StaticRouter` in your server side entry. The `StaticRouter` does not require a `history` prop to be provided, instead, you simply need to provide the current `location` as a string. In order to achieve this, we recommend your server side application uses [`jsdom`](https://github.com/jsdom/jsdom).

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

###### StaticRouter component props

| prop       | type       | description                                             |
| ---------- | ---------- | ------------------------------------------------------- |
| `routes`   | `Routes[]` | Your application's routes                               |
| `location` | `string`   | The string representation of the app's current location |

##### MemoryRouter component

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

###### MemoryRouter props

| prop       | type       | description                                             |
| ---------- | ---------- | ------------------------------------------------------- |
| `routes`   | `Routes[]` | Your application's routes                               |
| `location` | `string`   | The string representation of the app's current location |

##### Link component

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

###### Link component props

| prop      | type       | description                                                                |
| --------- | ---------- | -------------------------------------------------------------------------- |
| `target`  | `string`   | `<a>`tag target attribute                                                  |
| `replace` | `boolean`  | Determines if `history.replace` should be called instead of `history.push` |
| `href`    | `Href`     | The route to navigate to                                                   |
| `to`      | `Href`     | Alternative to `href`                                                      |
| `onClick` | `function` | The function to call when the component is clicked                         |
| `type`    | `string`   | The tag type to render, `a` and `button` are supported                     |

##### Redirect component

You can use a `Redirect` component as a route's `component` property to create a redirect route or to redirect a user elsewhere as part of internal component business logic.

```js
import { Redirect, useResource } from 'react-resource-router';
import { userResource } from 'src/routes/resources';
import { Profile } from 'src/components/user';

export const RedirectExample = () => {
  const [{ data, loading, error }] = useResource(userResource);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error && error.code === 403) {
    return <Redirect to="/login" />;
  }

  return <Profile data={data} />;
};
```

###### Redirect component props

| prop   | type                   | description                                                                          |
| ------ | ---------------------- | ------------------------------------------------------------------------------------ |
| `to`   | `Location` or `string` | Component children                                                                   |
| `push` | `boolean`              | Determines if the redirecting should use `history.push` instead of `history.replace` |

##### RouteComponent

The `RouteComponent` renders a `RouteSubscriber` internally and automatically renders the current route's `component` passing it the following props, known as `RouteContext`:

###### RouteComponent props

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

##### RouterSubscriber component

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

##### ResourceSubscriber component

The `ResourceSubscriber` is a component that is subscribed to the state of a resource. It can be used to access resource state via render props. We only recommend using this component if you are unable to use the [`useResource`](#useresource) hook.

###### ResourceSubscriber component props

| prop       | type            | description                  |
| ---------- | --------------- | ---------------------------- |
| `resource` | `RouteResource` | The resource to subscribe to |

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

##### RouterActions component

Actions that communicate with the router's routing functionality are exposed safely via the `RouterActions` component and [`useRouterActions`](#userouteractions) hook.

By using either of these you will gain access to the following actions

| prop            | type       | arguments                               | description                                                                                           |
| --------------- | ---------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `push`          | `function` | `path: Href` or `Location, state?: any` | Calls `history.push` with the supplied args                                                           |
| `replace`       | `function` | `path: Href` or `Location, state?: any` | Calls `history.replace` with the supplied args                                                        |
| `goBack`        | `function` |                                         | Goes to the previous route in history                                                                 |
| `goForward`     | `function` |                                         | Goes to the next route in history                                                                     |
| `registerBlock` | `function` | `blocker: HistoryBlocker`               | Custom `history` API that allows you to stop a transition from happening so route changes are stopped |

Here's how you can use the component:

```js
export const RouterActionsRenderPropsExample = () => (
  <RouterActions>
    {routerActions => <MyComponent push={routerActions.push} />}
  </RouterActions>
);
```

##### withRouter

The `withRouter` higher order component can be used for decorating your component. It provides the following props to its children:

###### withRouter props

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

#### Hooks

##### useResource

The `useResource` hook is the **recommended** way to subscribe route components to their respective resources.

```js
import { useResource } from 'react-resource-router';
import { feedResource } from '../routing/resources';
import { Loading, Error } from './primitives';
import { FeedList } from './FeedList';
import { FeedUpdater } from './FeedUpdater';
import { FeedRefresher } from './FeedRefresher';

export const Feed = () => {
  const [{ data, loading, error, update, refresh }] = useResource(feedResource);

  if (error) {
    return <Error error={error} />;
  }

  if (loading) {
    return <Loading />;
  }

  return (
    <>
      <FeedList items={data} />
      <FeedUpdater onUpdate={update} />
      <FeedRefresher onRefresh={refresh} />
    </>
  );
};
```

Check out [this section](#how-to-use-resources-in-your-components) for more details on how to use the `useResource` hook.

##### useRouter

You can use the `useRouter` hook to access current [route context](#routecomponent-props) as well as [router actions](#routeractions) if required.

```js
import { useRouter, RouterSubscriber, withRouter } from 'react-resource-router';

export const MyRouteComponent = () => {
  const [routerState, routerActions] = useRouter();

  return (
    <MyComponent location={routerState.location} push={routerActions.push} />
  );
};
```

##### useRouterActions

You can access [Router Actions](#routeractions) using this hook.

```js
export const RouterActionsHookExample = () => {
  const { push } = useRouterActions();

  return <MyComponent push={push} />;
};
```

#### Utilities

##### createBrowserHistory

This function creates a `BrowserHistory` instance. You will need to supply this to your `Router` in your client side code. Note that a single history instance _can_ be shared between routers if you are migrating away from `react-router`.

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

##### matchRoute

If you ever need to match the current route outside of the router itself, you can use this function. This may be required if you have any other app functionality that needs route context outside of the React lifecycle.

```js
import { appRoutes } from '../routing';

const { pathname, search } = window.location;
const matchedRoute = matchRoute(routes, pathname, search);
```
