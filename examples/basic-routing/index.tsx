import React from 'react';
import { createRoot } from 'react-dom/client';

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

const container = document.getElementById('root');
if (!container)
  throw new Error('No root element found to render basic routing example');

const root = createRoot(container);
root.render(<App />);
