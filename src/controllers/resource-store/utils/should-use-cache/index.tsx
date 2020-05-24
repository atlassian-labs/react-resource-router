import { RouteResourceResponse } from '../../../../common/types';

export const isFromSsr = ({ expiresAt }: RouteResourceResponse): boolean =>
  expiresAt === null;

const isFresh = (resource: RouteResourceResponse): boolean => {
  if (isFromSsr(resource)) {
    return true;
  }

  return Date.now() < Number(resource.expiresAt);
};

const isCached = ({ data, error }: RouteResourceResponse) => data || error;

export const shouldUseCache = (resource: RouteResourceResponse): boolean => {
  if (resource.loading) {
    return true;
  }

  if (isCached(resource) && isFresh(resource)) {
    return true;
  }

  return false;
};
