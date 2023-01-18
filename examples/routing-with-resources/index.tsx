import React from 'react';
import { render } from 'react-dom';

import { entryPointsLoader } from '../../src/entry-points/loader';
import { resourcesLoader } from '../../src/resources/loader';

import { homeRoute, aboutRoute } from './routes';

import {
  Router,
  RouteComponent,
  createBrowserHistory,
  combine,
} from 'react-resource-router';

const myHistory = createBrowserHistory();

const appRoutes = [homeRoute, aboutRoute];

const App = () => {
  return (
    <Router
      routes={appRoutes}
      history={myHistory}
      basePath="/routing-with-resources"
      onPrefetch={({ route }) => console.log('Prefetching route', route.name)}
      loader={combine(entryPointsLoader, resourcesLoader)}
    >
      <RouteComponent />
    </Router>
  );
};

render(<App />, document.getElementById('root'));
