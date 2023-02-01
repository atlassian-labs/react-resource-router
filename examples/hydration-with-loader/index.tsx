import React from 'react';
import { render } from 'react-dom';
import { defaultRegistry } from 'react-sweet-state';

import { createResourcesLoader, getResourcesSafeData } from '../../resources';

import { homeRoute } from './routes';

import {
  Router,
  RouteComponent,
  createBrowserHistory,
} from 'react-resource-router';

const myHistory = createBrowserHistory();

const appRoutes = [homeRoute];

const getStateFromServer = async () => {
  const resourcesLoader = createResourcesLoader({
    resourceData: null,
  });

  const data = Router.requestResources({
    location: '/',
    routes: appRoutes,
    loaders: [resourcesLoader],
  });

  // await data.resources;
  await data;

  const resourceData = getResourcesSafeData();

  // clearing the store
  defaultRegistry.stores.clear();

  return resourceData;
};

const main = async () => {
  const data = await getStateFromServer();
  const resourceLoader = createResourcesLoader({
    resourceData: data,
  });

  const App = () => {
    return (
      <Router
        basePath="/hydration-with-loader"
        history={myHistory}
        loaders={[resourceLoader]}
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
