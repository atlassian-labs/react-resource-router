import React from 'react';
import ReactDOM from 'react-dom';

import {
  Router,
  RouteComponent,
  createBrowserHistory,
} from 'react-resource-router';

import Home from './home';
import QueryParamExample from './use-query-param';
import PathParamExample from './use-path-param';

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
    name: 'query-param',
    path: '/query-param',
    exact: true,
    component: QueryParamExample,
    navigation: null,
  },
  {
    name: 'path-param',
    path: '/path-param/:foo/:bar',
    exact: true,
    component: PathParamExample,
    navigation: null,
  },
];

const App = () => {
  return (
    <Router routes={appRoutes} history={myHistory} basename="/hooks">
      <RouteComponent />
    </Router>
  );
};

ReactDOM.render(<App />, document.getElementById('root'));
