import React from 'react';
import { render } from 'react-dom';

import { homeRoute, aboutRoute } from './routes';

import {
  Router,
  RouteComponent,
  createBrowserHistory,
} from 'react-resource-router';

const myHistory = createBrowserHistory();

const appRoutes = [homeRoute, aboutRoute];

const App = () => {
  return (
    <Router
      basePath="/routing-with-resources"
      history={myHistory}
      onPrefetch={({ route }) => console.log('Prefetching route', route.name)}
      routes={appRoutes}
    >
      <RouteComponent />
    </Router>
  );
};

render(<App />, document.getElementById('root'));
