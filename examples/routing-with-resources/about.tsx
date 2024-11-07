import React from 'react';

// eslint-disable-next-line import/no-cycle
import { homeRoute } from './routes';

import { Link, useQueryParam } from 'react-resource-router';
import { createResource, useResource } from 'react-resource-router/resources';

export const aboutResource = createResource({
  type: 'about',
  getKey: ({ query }) => `${query.name}`,
  maxAge: 30000,
  getData: async ({ query }) => {
    const { name } = query;
    const response = await fetch(
      `https://dog.ceo/api/breed/${name}/images/random`
    );
    const result: { message: string } = await response.json();

    return result;
  },
  maxCache: 5,
});

export const About = () => {
  // eslint-disable-next-line
  const { data, loading, error } = useResource(aboutResource);
  const [breedName] = useQueryParam('name');

  return (
    <div>
      <h1>{breedName}</h1>
      <Link to={homeRoute}>Go to home</Link>
      <section>
        {!loading && <img alt="A cute dog!" src={data?.message} />}
      </section>
    </div>
  );
};
