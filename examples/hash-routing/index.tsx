import { createHashHistory as createHashHistory4 } from 'history';
import { createHashHistory as createHashHistory5 } from 'history-5';
import React from 'react';
import { render } from 'react-dom';

import { About } from './about';
import { Home } from './home';

import { Redirect, RouteComponent, Router } from 'react-resource-router';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const history4 = createHashHistory4();
const history5 = createHashHistory5();
const history = history5;

const routes = [
  {
    name: 'home',
    path: '/home',
    exact: true,
    component: () => <Home />,
  },
  {
    name: 'about',
    path: '/about',
    exact: true,
    component: () => <About />,
  },
  {
    name: 'default',
    path: '/*',
    exact: true,
    component: () => <Redirect to="/home" />,
  },
];

const App = () => {
  return (
    <Router history={history} routes={routes} plugins={[]}>
      <RouteComponent />
    </Router>
  );
};

render(<App />, document.getElementById('root'));
