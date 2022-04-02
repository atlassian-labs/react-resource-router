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
    <Navigation />
    <RouteComponent />
    <Footer />
  </>
);
```

When however you need to SSR your app, we need pass different props to Router, as `createBrowserHistory` does not really work on server, so we recommend to use `location` instead (or pass your own `MemoryHistory` if needed)

```js
// server-app.js
import { Router } from 'react-resource-router';
import { App } from '../components';
import { routes } from '../routing/routes';

export const ServerApp = ({ location }) => (
  <Router routes={routes} location={location}>
    <App />
  </Router>
);
```

```js
// client-app.js
import { Router, createBrowserHistory } from 'react-resource-router';
import { App } from '../components';
import { routes } from '../routing/routes';

const history = createBrowserHistory();

export const ClientApp = () => (
  <Router routes={routes} history={history}>
    <App />
  </Router>
);
```

## Requesting Resources

Until React Suspense works on the server, we cannot do progressive rendering server side. To get around this, we need to `await` all resource requests to render our app _with all our resource data_ on the server.

Luckily the `Router` provides a convenient static method to do this for us.

```js
import { renderToString } from 'react-dom/server';
import { Router } from 'react-resource-router';
import { routes } from '../routing/routes';
import { ServerApp } from './app';

const renderToStringWithData = async ({ location }) => {
  await Router.requestResources({ location, routes });

  return renderToString(<ServerApp location={location} />);
};
```

Notice that we do not need to provide any `resourceData` object to the `ServerApp`, the `Router` handles this for us internally.

To prevent slow APIs from causing long renders on the server you can optionally pass in `timeout` as an option to `Router.requestResources`. If a route resource does not return within the specified time then its data and promise will be set to null.
