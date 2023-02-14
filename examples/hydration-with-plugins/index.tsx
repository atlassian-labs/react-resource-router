import React from 'react';
import { render } from 'react-dom';
import { defaultRegistry } from 'react-sweet-state';

import {
  createResourcesPlugin,
  getSerializedResources,
} from '../../src/resources';

import { homeRoute } from './routes';

import {
  Router,
  RouteComponent,
  createBrowserHistory,
} from 'react-resource-router';

const myHistory = createBrowserHistory();

const appRoutes = [homeRoute];

const getStateFromServer = async () => {
  const resourcesPlugin = createResourcesPlugin({
    resourceData: null,
  });

  await Router.requestResources({
    location: '/',
    routes: appRoutes,
    plugins: [resourcesPlugin],
  });

  const resourceData = getSerializedResources();

  // clearing the store
  defaultRegistry.stores.clear();

  return resourceData;
};

const main = async () => {
  const data = await getStateFromServer();
  const resourcesPlugin = createResourcesPlugin({
    resourceData: data,
  });

  const App = () => {
    return (
      <Router
        basePath="/hydration-with-plugins"
        history={myHistory}
        plugins={[resourcesPlugin]}
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
