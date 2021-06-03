import { createResource } from 'react-resource-router';

export default createResource({
  type: 'page',
  getKey: ({ route }) => route.name,
  maxAge: 10 * 60 * 1000,
  maxCache: 2,
  getData: async ({ route }) => {
    const response = await fetch(`https://dog.ceo/api/breeds/image/random?param=${route.name}`);
    const result: { message: string } = await response.json();

    return result;
  },
});
