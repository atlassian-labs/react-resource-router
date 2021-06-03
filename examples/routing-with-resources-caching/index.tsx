import React from 'react';
import ReactDOM from 'react-dom';

import {
  Link,
  Router,
  RouteComponent,
  createBrowserHistory,
} from 'react-resource-router';

import { homeRoute, aboutRoute, contactRoute } from './routes';

const myHistory = createBrowserHistory();

const appRoutes = [homeRoute, aboutRoute, contactRoute];

const navStyle = {
  margin: '10px'
}

const App = () => {
  return (
    <>
      <nav>
        <Link to={homeRoute} style={navStyle}>
          Home
        </Link>
        <Link to={aboutRoute} style={navStyle}>
          About
        </Link>
        <Link to={contactRoute} style={navStyle}>
          Contact
        </Link>
      </nav>
      <Router
        routes={appRoutes}
        history={myHistory}
        basePath="/routing-with-resources-caching"
        onPrefetch={({ route }) => console.log('Prefetcing route', route.name)}
      >
        <RouteComponent />
      </Router>
    </>
  );
};

ReactDOM.render(<App />, document.getElementById('root'));
