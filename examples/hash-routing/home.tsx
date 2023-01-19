import React from 'react';

import { Link } from 'react-resource-router';

export const Home = () => (
  <div>
    <h1>Home</h1>
    <Link to="/about">Go to about</Link>
  </div>
);
