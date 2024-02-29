import { createMemoryHistory } from 'history';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { defaultRegistry } from 'react-sweet-state';

import { homeRoute } from './routes';

import {
  Router,
  RouteComponent,
  createBrowserHistory,
  invokePluginLoad,
} from 'react-resource-router';
import { createResourcesPlugin } from 'react-resource-router/resources';

const myHistory = createBrowserHistory();

const appRoutes = [homeRoute];

const getStateFromServer = async () => {
  const resourcesPlugin = createResourcesPlugin({});

  invokePluginLoad([resourcesPlugin], {
    history: createMemoryHistory({ initialEntries: [location] }),
    routes: appRoutes,
    basePath: '/hydration-with-plugins',
  });

  const resourceData = await resourcesPlugin.getSerializedResources();

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
        routes={appRoutes}
      >
        <RouteComponent />
      </Router>
    );
  };

  const container = document.getElementById('root');
  if (!container)
    throw new Error('No root element found to render hydration example');

  const root = createRoot(container);
  root.render(<App />);
};

main();
