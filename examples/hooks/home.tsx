import React from 'react';
import { Link } from '../../src';

const Home = () => {
  return (
    <div>
      <h1>Available Hooks</h1>
      <Link to={'/query-param?foo=abc&bar=xyz#abc'}>useQueryParam</Link>
      <br />
      <Link to={'/path-param/hello/world#abc?foo=abc&bar=xyz'}>
        usePathParam
      </Link>
    </div>
  );
};

export default Home;
