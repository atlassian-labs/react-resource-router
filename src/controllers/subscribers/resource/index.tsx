import React, { ReactNode } from 'react';

import {
  RouteResource,
  RouteResourceResponse,
  RouteResourceUpdater,
  RouterContext,
} from '../../../common/types';
import { useResource } from '../../hooks/resource-store';

type Props = {
  children: (
    resource: RouteResourceResponse & {
      update: (getNewData: RouteResourceUpdater) => void;
      refresh: () => void;
    }
  ) => ReactNode;
  resource: RouteResource;
  options?: {
    routerContext?: RouterContext;
  };
};

export const ResourceSubscriber = ({ children, resource, options }: Props) => {
  const result = useResource(resource, options);

  return <>{children(result)}</>;
};
