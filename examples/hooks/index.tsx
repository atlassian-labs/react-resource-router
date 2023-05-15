import React from 'react';
import { render } from 'react-dom';

import { shouldReloadWhenRouteMatchChanges } from '../../src/utils';

import Home from './home';
import PathParamExample, { testResource } from './use-path-param';
import QueryParamExample from './use-query-param';

import {
  Router,
  RouteComponent,
  createBrowserHistory,
  createRouterSelector,
} from 'react-resource-router';

const myHistory = createBrowserHistory();
const useRouteName = createRouterSelector(s => s.route.name);

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
    resources: [testResource],
    EXPERIMENTAL__shouldReload: shouldReloadWhenRouteMatchChanges({
      params: ['foo'],
    }),
  },
];

const Title = () => {
  const title = useRouteName();

  return <p>Page: {title}</p>;
};

const App = () => {
  return (
    <Router basePath="/hooks" history={myHistory} routes={appRoutes}>
      <Title />
      <RouteComponent />
    </Router>
  );
};

render(<App />, document.getElementById('root'));
