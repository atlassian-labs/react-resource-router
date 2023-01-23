import React from 'react';
import { render } from 'react-dom';
import { defaultRegistry } from 'react-sweet-state';

import { homeRoute } from './routes';

import {
  Router,
  RouteComponent,
  createBrowserHistory,
} from 'react-resource-router';

const myHistory = createBrowserHistory();

const appRoutes = [homeRoute];

const getStateFromServer = async () => {
  const resourceData = await Router.requestResources({
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
        basePath="/hydration"
        history={myHistory}
        resourceData={data}
        routes={appRoutes}
      >
        <RouteComponent />
      </Router>
    );
  };

  render(<App />, document.getElementById('root'));
};

main();
