import React from 'react';
import { Link } from 'react-resource-router';

const baseURL = '/hooks';

const Home = () => {
  return (
    <div>
      <h1>Available Hooks</h1>
      <Link to={`${baseURL}/query-param?foo=abc&bar=xyz`}>useQueryParam</Link>
    </div>
  );
};

export default Home;
