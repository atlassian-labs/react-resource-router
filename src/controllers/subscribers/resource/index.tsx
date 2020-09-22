import React, { ReactNode } from 'react';

import {
  RouteResource,
  RouteResourceResponse,
  RouteResourceUpdater,
  RouterContext,
} from '../../../common/types';
import { useResource } from '../../hooks/resource-store';

type Props<T> = {
  children: (
    resource: RouteResourceResponse<T> & {
      update: (getNewData: RouteResourceUpdater<T>) => void;
      refresh: () => void;
    }
  ) => ReactNode;
  resource: RouteResource<T>;
  options?: {
    routerContext?: RouterContext;
  };
};

export const ResourceSubscriber = <T extends unknown>({
  children,
  resource,
  options,
}: Props<T>) => {
  const result = useResource(resource, options);

  return <>{children(result)}</>;
};
