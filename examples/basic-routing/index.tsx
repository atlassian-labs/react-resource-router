import React from 'react';
import { render } from 'react-dom';

import { About } from './about';
import { Home } from './home';

import {
  Router,
  RouteComponent,
  createBrowserHistory,
} from 'react-resource-router';

const myHistory = createBrowserHistory();

const appRoutes = [
  {
    name: 'home',
    path: '/',
    exact: true,
    component: Home,
    navigation: null,
  },
  {
    name: 'about',
    path: '/about',
    exact: true,
    component: About,
    navigation: null,
  },
];

const App = () => {
  return (
    <Router
      basePath="/basic-routing"
      history={myHistory}
      routes={appRoutes}
      plugins={[]}
    >
      <RouteComponent />
    </Router>
  );
};

render(<App />, document.getElementById('root'));
