import React from 'react';
import { render } from 'react-dom';
import { defaultRegistry } from 'react-sweet-state';

import { homeRoute } from './routes';

import {
  Router,
  RouteComponent,
  createBrowserHistory,
  StaticRouter,
} from 'react-resource-router';

const myHistory = createBrowserHistory();

const appRoutes = [homeRoute];

const getStateFromServer = async () => {
  // StaticRouter should only be used on Server!
  // It's used in Browser in this example for simplicity.
  const resourceData = await StaticRouter.requestResources({
    location: '/',
    routes: appRoutes,
  });

  // clearing the store
  defaultRegistry.stores.clear();

  return resourceData;
};

const main = async () => {
  const data = await getStateFromServer();

  const App = () => {
    return (
      <Router
        routes={appRoutes}
        history={myHistory}
        basePath="/hydration"
        resourceData={data}
      >
        <RouteComponent />
      </Router>
    );
  };

  render(<App />, document.getElementById('root'));
};

main();
