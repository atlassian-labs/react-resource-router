import React from 'react';
import { render } from 'react-dom';
import { defaultRegistry } from 'react-sweet-state';

import { entryPointsLoader } from '../../src/entry-points/loader';
import { resourcesLoader } from '../../src/resources/loader';

import { homeRoute } from './routes';

import {
  Router,
  RouteComponent,
  createBrowserHistory,
  StaticRouter,
  combine,
} from 'react-resource-router';

const myHistory = createBrowserHistory();

const appRoutes = [homeRoute];

const loader = combine(resourcesLoader, entryPointsLoader);

const getStateFromServer = async () => {
  // StaticRouter should only be used on Server!
  // It's used in Browser in this example for simplicity.
  const resourceData = await StaticRouter.requestResources({
    location: '/',
    routes: appRoutes,
    loader,
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
        loader={loader}
      >
        <RouteComponent />
      </Router>
    );
  };

  render(<App />, document.getElementById('root'));
};

main();
