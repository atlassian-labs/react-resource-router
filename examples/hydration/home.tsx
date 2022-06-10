import React from 'react';
import { createResource, useResource } from '../../src';

export const homeResource = createResource({
  type: 'home',
  getKey: () => 'breedList',
  maxAge: 10000,
  getData: async () => {
    const response = await fetch('https://dog.ceo/api/breeds/image/random');
    const result: { message: string } = await response.json();

    return result;
  },
  isBrowserOnly: true,
});

export const Home = () => {
  // eslint-disable-next-line
  const { data, loading, error } = useResource(homeResource);

  return (
    <div>
      <h1>Random Dog</h1>
      <section>
        {data?.message && <img style={{ width: '400px' }} src={data.message} />}
      </section>
    </div>
  );
};
