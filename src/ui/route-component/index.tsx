import React from 'react';

import { RouterSubscriber } from '../../controllers';

export const RouteComponent = () => (
  <RouterSubscriber>
    {({ route, location, query, match, action }) =>
      !route ? null : (
        <route.component
          route={route}
          location={location}
          query={query}
          match={match}
          action={action}
        />
      )
    }
  </RouterSubscriber>
);
