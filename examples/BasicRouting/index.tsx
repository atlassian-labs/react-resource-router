import React from 'react';

import {
  Router,
  RouteComponent,
  createBrowserHistory,
} from 'react-resource-router';

import { Home } from './home';
import { About } from './about';

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

const BasicRoutingExample = () => {
  return (
    <Router routes={appRoutes} history={myHistory}>
      <RouteComponent />
    </Router>
  );
};

export default BasicRoutingExample;
