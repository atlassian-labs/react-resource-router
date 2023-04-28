import { RouteResourceResponse } from '../../../../../common/types';

export const isFromSsr = ({ expiresAt }: RouteResourceResponse): boolean =>
  expiresAt === null;

const isFresh = (resource: RouteResourceResponse): boolean => {
  if (isFromSsr(resource)) {
    return true;
  }

  return Date.now() < Number(resource.expiresAt);
};

export const shouldUseCache = (resource: RouteResourceResponse): boolean => {
  if (resource?.error?.name === 'TimeoutError') {
    return false;
  }

  if (resource.loading) {
    return true;
  }

  if (isFresh(resource)) {
    return true;
  }

  return false;
};
