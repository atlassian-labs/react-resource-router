import React from 'react';
import { useResource } from 'react-resource-router';
import resource from './resource';

export const Contact = () => {
  const { data, loading } = useResource(resource);

  return (
    <div>
      <h1>Contact</h1>
      <section>
        <p>A picture of a schnauzer</p>
        <section>
          {!loading && <img src={data?.message} alt="A cute dog!" />}
        </section>
      </section>
    </div>
  );
};
