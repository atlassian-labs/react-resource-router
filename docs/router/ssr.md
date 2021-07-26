# How to use the Router in SSR

RRR supports server side rendered apps out of the box. If this is something that you would like to take advantage of, there are a few things we encourage you to think about first

## Tree Composition

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

## Requesting Resources

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

Notice that we do not need to provide any `resourceData` object to the `ServerApp`, the `StaticRouter` handles this for us internally.

To prevent slow APIs from causing long renders on the server you can optionally pass in `timeout` as an option to `StaticRouter.requestResources`. If a route resource does not return within the specified time then its data and promise will be set to null.
