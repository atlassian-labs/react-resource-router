import React from 'react';
import ReactDOM from 'react-dom';
import { defaultRegistry } from 'react-sweet-state';

import {
  Router,
  RouteComponent,
  createBrowserHistory,
  StaticRouter,
} from '../../src';

import { homeRoute } from './routes';

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

  ReactDOM.render(<App />, document.getElementById('root'));
};

main();
