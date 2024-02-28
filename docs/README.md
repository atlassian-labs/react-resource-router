<h1>
  <img align="middle" src="https://user-images.githubusercontent.com/84136/83958672-e99bba00-a8b7-11ea-81c7-0397f23e8a04.png" alt="react-resource-router logo" height="80" /> &nbsp;
  <span>react-resource-router</span>
</h1>

React Resource Router (RRR) is a configuration driven routing solution for React that manages single page application route matching, data fetching and progressive rendering.

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

Resources describe and provide the data required for your route. This data is safely stored and accessed via the [`useResource`](api/hooks.md#use-resource) hook or [`ResourceSubscriber`](api/components.md#resourcesubscriber) component.

```js
import { createResource } from 'react-resource-router/resources';
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

These are the React components that get rendered for your routes. As mentioned, they can be wired into the state of your resources via the [`useResource`](api/hooks.md#use-resource) hook or [`ResourceSubscriber`](api/components.md#resourcesubscriber) component.

```js
import { useResource } from 'react-resource-router/resources';
import { aboutResource, homeResource } from '../routes/resources';
import { Loading, Error } from './common';

export const Home = () => {
  const { data, loading, error } = useResource(homeResource);

  if (error) {
    return <Error error={error} />;
  }

  if (loading) {
    return <Loading />;
  }

  return <div>{data.home.content}</div>;
};

export const About = () => {
  const { data, loading, error } = useResource(aboutResource);

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

Your [route configuration](router/configuration.md#how-to-configure-the-router) is the single source of truth for your application's routing concerns.

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

Now that you've set up your resources, components and configuration correctly, all you need to do is mount the [Router](api/components.md#router) with the [Resources Plugin](api/components?id=resources-plugin) in your react tree, and a [`RouteComponent`](api/components.md#routecomponent) as a child. It will do the rest!

```js
import {
  Router,
  RouteComponent,
  createBrowserHistory,
} from 'react-resource-router';
import { createResourcesPlugin } from "react-resource-router/resources";
import { appRoutes } from './routing/routes';

const history = createBrowserHistory();
const resourcesPlugin = createResourcesPlugin({});

const App = () => (
  <Router routes={appRoutes} history={history} plugins={[resourcesPlugin]}>
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

## Thanks

Big thanks to [Thinkmill](https://www.thinkmill.com.au/) for their involvement in this project.

## License

Copyright (c) 2020 Atlassian and others.
Apache 2.0 licensed, see [LICENSE](LICENSE) file.

<br/>

[![With ❤️ from Atlassian](https://raw.githubusercontent.com/atlassian-internal/oss-assets/master/banner-cheers-light.png)](https://www.atlassian.com)
