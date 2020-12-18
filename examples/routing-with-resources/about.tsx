import React from 'react';
import { Link, createResource, useResource } from 'react-resource-router';
import { homeRoute } from './routes';

export const aboutResource = createResource({
  type: 'about',
  getKey: () => 'data',
  maxAge: 0,
  getData: async () => {
    const response = await fetch(
      'https://dog.ceo/api/breed/schnauzer/images/random'
    );
    const result: { message: string } = await response.json();

    return result;
  },
});

export const About = () => {
  // eslint-disable-next-line
  const { data, loading, error } = useResource(aboutResource);

  return (
    <div>
      <h1>About</h1>
      <Link to={homeRoute}>Go to home</Link>
      <section>
        <p>A picture of a schnauzer</p>
        <section>
          {!loading && <img src={data?.message} alt="A cute dog!" />}
        </section>
      </section>
    </div>
  );
};
