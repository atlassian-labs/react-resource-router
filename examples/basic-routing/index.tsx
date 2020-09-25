import React from 'react';
import ReactDOM from 'react-dom';

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

const App = () => {
  return (
    <Router routes={appRoutes} history={myHistory} basename="/basic-routing">
      <RouteComponent />
    </Router>
  );
};

ReactDOM.render(<App />, document.getElementById('root'));
