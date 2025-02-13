import React from 'react';

// eslint-disable-next-line import/no-cycle
import { aboutRoute } from './routes';

import { Link } from 'react-resource-router';
import { createResource, useResource } from 'react-resource-router/resources';

export const homeResource = createResource({
  type: 'home',
  getKey: () => 'breedList',
  maxAge: 10000,
  getData: async () => {
    const response = await fetch('https://dog.ceo/api/breeds/list/all');
    const result: { message: string } = await response.json();

    return result;
  },
});

export const Home = () => {
  // eslint-disable-next-line
  const { data, loading, error } = useResource(homeResource);
  const breeds = data?.message ? Object.keys(data.message) : [];

  return (
    <div>
      <h1>Dog Breeds</h1>
      <section>
        <ul>
          {breeds.slice(0, 25).map(breed => (
            <li key={breed}>
              <Link prefetch="hover" query={{ name: breed }} to={aboutRoute}>
                {breed}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};
