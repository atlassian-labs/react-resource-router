import React from 'react';
import { Link } from 'react-resource-router';

const baseURL = 'basic-routing';

export const About = () => (
  <div>
    <h1>About</h1>
    <Link to={`/${baseURL}`}>Go to home</Link>
  </div>
);
