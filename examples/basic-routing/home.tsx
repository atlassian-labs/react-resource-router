import React from 'react';
import { Link } from 'react-resource-router';

const baseURL = 'basic-routing';

export const Home = () => (
  <div>
    <h1>Home</h1>
    <Link to={`/${baseURL}/about`}>Go to about</Link>
  </div>
);
