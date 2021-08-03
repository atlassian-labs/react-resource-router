import React from 'react';
import {
  Link,
  createResource,
  useResource,
  useQueryParam,
} from 'react-resource-router';
import { homeRoute } from './routes';

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
        {!loading && <img src={data?.message} alt="A cute dog!" />}
      </section>
    </div>
  );
};
