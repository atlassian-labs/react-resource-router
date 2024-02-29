import React from 'react';
import { createRoot } from 'react-dom/client';

import { homeRoute, aboutRoute } from './routes';

import {
  Router,
  RouteComponent,
  createBrowserHistory,
} from 'react-resource-router';
import { createResourcesPlugin } from 'react-resource-router/resources';

const myHistory = createBrowserHistory();

const appRoutes = [homeRoute, aboutRoute];

const App = () => {
  return (
    <Router
      basePath="/routing-with-resources"
      history={myHistory}
      onPrefetch={({ route }) => console.log('Prefetching route', route.name)}
      routes={appRoutes}
      plugins={[createResourcesPlugin({})]}
    >
      <RouteComponent />
    </Router>
  );
};

const container = document.getElementById('root');
if (!container)
  throw new Error('No root element found to render resources example');

const root = createRoot(container);
root.render(<App />);
