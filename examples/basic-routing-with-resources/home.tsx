import React from 'react';
import { Link, createResource, useResource } from 'react-resource-router';

export const homeResource = createResource({
  type: 'home',
  getKey: () => 'data',
  maxAge: 0,
  getData: async () => {
    const response = await fetch('https://dog.ceo/api/breeds/image/random');
    const result:{ message: string} = await response.json();

    return result;
  },
});

const baseURL = 'basic-routing-with-resources';

export const Home = () => {
  // eslint-disable-next-line
  const { data, loading, error } = useResource(homeResource);

  return (
    <div>
      <h1>Home</h1>
      <Link to={`/${baseURL}/about`}>Go to about</Link>
      <section>
        <p>A random picture of a cute dog</p>
        <section>
          {!loading && <img src={data?.message} alt="A cute dog!" />}
        </section>
      </section>
    </div>
  );
};
