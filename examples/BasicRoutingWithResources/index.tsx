import React from 'react';

import {
  Router,
  RouteComponent,
  createBrowserHistory,
} from 'react-resource-router';

import { Home, homeResource } from './home';
import { About, aboutResource } from './about';

const myHistory = createBrowserHistory();

const appRoutes = [
  {
    name: 'home',
    path: '/',
    exact: true,
    component: Home,
    navigation: null,
    resources: [homeResource],
  },
  {
    name: 'about',
    path: '/about',
    exact: true,
    component: About,
    navigation: null,
    resources: [aboutResource],
  },
];

const BasicRoutingWithResourcesExample = () => {
  return (
    <Router routes={appRoutes} history={myHistory}>
      <RouteComponent />
    </Router>
  );
};

export default BasicRoutingWithResourcesExample;
