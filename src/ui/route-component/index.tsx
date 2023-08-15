import React from 'react';

import { useRouter } from '../../controllers';

export const RouteComponent = () => {
  const [{ action, location, match, query, route }] = useRouter();

  if (!route || !route.component) {
    return null;
  }

  return (
    <route.component
      action={action}
      location={location}
      match={match}
      query={query}
      route={route}
    />
  );
};
