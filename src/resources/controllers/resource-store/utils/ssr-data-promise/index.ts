import { RouteResourceResponse } from '../../../../common/types';

export const setSsrDataPromise = (
  slice: RouteResourceResponse
): RouteResourceResponse =>
  slice.promise === null
    ? { ...slice, promise: Promise.resolve(slice.data) }
    : slice;
