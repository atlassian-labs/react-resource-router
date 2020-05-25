import React, { ReactNode } from 'react';

import {
  RouteResource,
  RouteResourceResponse,
  RouteResourceUpdater,
} from '../../../common/types';
import {
  ResourceActions,
  ResourceSubscriber as ResourceSweetStateSubscriber,
} from '../../resource-store';
import { RouterSubscriber } from '../route';

type Props = {
  children: (
    resource: RouteResourceResponse & {
      update: (getNewData: RouteResourceUpdater) => void;
      refresh: () => void;
    }
  ) => ReactNode;
  resource: RouteResource;
};

export const ResourceSubscriber = ({ children, resource }: Props) => (
  <ResourceActions>
    {(_, actions) => (
      <RouterSubscriber>
        {({ route, match, query, location }) => {
          const routerStoreContext = {
            route,
            match,
            query,
            location,
          };
          const { type, getKey, maxAge } = resource;
          const key = getKey(routerStoreContext, actions.getContext());

          return (
            <ResourceSweetStateSubscriber resourceType={type} resourceKey={key}>
              {slice =>
                children({
                  ...slice,
                  update: (getNewData: RouteResourceUpdater) => {
                    actions.updateResourceState(type, key, maxAge, getNewData);
                  },
                  refresh: () => {
                    actions.getResourceFromRemote(resource, routerStoreContext);
                  },
                })
              }
            </ResourceSweetStateSubscriber>
          );
        }}
      </RouterSubscriber>
    )}
  </ResourceActions>
);
