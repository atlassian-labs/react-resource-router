import React from 'react';
import ReactDOM from 'react-dom';

import { Router, RouteComponent, createBrowserHistory } from '../../src';

import { homeRoute, aboutRoute } from './routes';

const myHistory = createBrowserHistory();

const appRoutes = [homeRoute, aboutRoute];

const App = () => {
  return (
    <Router
      routes={appRoutes}
      history={myHistory}
      basePath="/routing-with-resources"
      onPrefetch={({ route }) => console.log('Prefetcing route', route.name)}
    >
      <RouteComponent />
    </Router>
  );
};

ReactDOM.render(<App />, document.getElementById('root'));
