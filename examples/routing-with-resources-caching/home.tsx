import React from 'react';
import { useResource } from 'react-resource-router';
import resource from './resource';

export const Home = () => {
  const { data, loading } = useResource(resource);

  return (
    <div>
      <h1>Home</h1>
      <section>
        <p>A random picture of a cute dog</p>
        <section>
          {!loading && <img src={data?.message} alt="A cute dog!" />}
        </section>
      </section>
    </div>
  );
};
