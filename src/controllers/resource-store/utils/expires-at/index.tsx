import { RouteResourceResponse } from '../../../../common/types';

export const getExpiresAt = (maxAge: number): number => Date.now() + maxAge;

export const setExpiresAt = (
  slice: RouteResourceResponse,
  maxAge: number,
): RouteResourceResponse =>
  slice.expiresAt === null
    ? { ...slice, expiresAt: getExpiresAt(maxAge) }
    : slice;
