<p align="center">
  <img src="https://user-images.githubusercontent.com/84136/83958672-e99bba00-a8b7-11ea-81c7-0397f23e8a04.png" alt="react-resource-router logo" height="150" />
</p>
<h1 align="center">react-resource-router</h1>
<p align="center">
  <a href="https://www.npmjs.com/package/react-resource-router"><img src="https://img.shields.io/npm/v/react-resource-router.svg"></a>
  <a href="https://bundlephobia.com/result?p=react-resource-router"><img src="https://img.shields.io/bundlephobia/minzip/react-resource-router.svg" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-Apache%202.0-blue.svg"></a>
  <a href="CONTRIBUTING.md"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" /></a>
</p>

React Resource Router (RRR) is a configuration driven routing solution for React that manages single page application route matching, data fetching and progressive rendering.

## Why?

React Resource Router was developed by Atlassian for [Jira](https://www.atlassian.com/software/jira) primarily to improve **performance** and prepare for **compatibility** with React's forthcoming [Concurrent Mode](https://reactjs.org/docs/concurrent-mode-intro.html) on both client and server. You can read more about its development and impact [here](https://www.atlassian.com/engineering/react-resource-router-deep-dive).

### Features

- Fully driven by a static configuration of route objects
- Each route object contains the following core properties
  - `path` - the path to match
  - `component` - the component to render
  - `resources` - an array of objects containing fetch functions that request the route component's data
- Data for a route is requested **asynchronously** and **as early as possible**, with the page progressively rendering as the requests resolve. This results in quicker meaningful render times
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

const history = createBrowserHistory();

const App = () => (
  <Router routes={appRoutes} history={history}>
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

## Documentation

Check the [docs website](https://atlassian-labs.github.io/react-resource-router/) or the [docs folder](https://github.com/atlassian-labs/react-resource-router/tree/master/docs).

## Examples

You can checkout the repo and play around with the examples we have setup to demonstrate how the API can be used for various use cases.

1. Clone the repo and install dependencies
2. Run `npm start`
3. Local dev site will launch with all the examples



## Thanks

Big thanks to [Thinkmill](https://www.thinkmill.com.au/) for their involvement in this project.

## License

Copyright (c) 2020 Atlassian and others.
Apache 2.0 licensed, see [LICENSE](LICENSE) file.

<br/>

[![With ❤️ from Atlassian](https://raw.githubusercontent.com/atlassian-internal/oss-assets/master/banner-cheers-light.png)](https://www.atlassian.com)
