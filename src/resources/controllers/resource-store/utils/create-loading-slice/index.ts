import type { RouterContext } from '../../../../../index';
import type {
  ResourceDependencies,
  ResourceStoreContext,
  RouteResource,
} from '../../../../common/types';
import { GetResourceOptions, PrefetchSlice } from '../../types';
import { DEFAULT_RESOURCE_MAX_AGE } from '../create-resource/constants';
import { getExpiresAt } from '../expires-at';
import { generateTimeGuard } from '../generate-time-guard';
import { TimeoutError } from '../timeout-error';

import { DEFAULT_PREFETCH_MAX_AGE } from './constants';

export function createLoadingSlice({
  context,
  dependencies,
  options,
  resource,
  routerStoreContext,
}: {
  context: ResourceStoreContext;
  dependencies: () => ResourceDependencies;
  options: GetResourceOptions;
  resource: RouteResource;
  routerStoreContext: RouterContext;
}): PrefetchSlice {
  const { type, getData } = resource;
  const { prefetch, timeout } = options;

  // hard errors in dependencies or getData are converted into softer async error
  let promiseOrData: unknown | Promise<unknown>;
  try {
    promiseOrData = getData(
      {
        ...routerStoreContext,
        isPrefetch: !!prefetch,
        dependencies: dependencies(),
      },
      context
    );
  } catch (error) {
    promiseOrData = Promise.reject(error);
  }

  // ensure the promise includes any timeout error
  const timeoutGuard = timeout ? generateTimeGuard(timeout) : null;

  // check if getData was sync, by looking for a Promise-like shape
  const data =
    typeof (promiseOrData as any)?.then === 'function'
      ? undefined
      : promiseOrData;
  const promise = timeout
    ? Promise.race([promiseOrData, timeoutGuard?.promise]).then(maybeData => {
        if (timeoutGuard && !timeoutGuard.isPending) {
          throw new TimeoutError(type);
        }
        timeoutGuard?.timerId && clearTimeout(timeoutGuard.timerId);

        return maybeData;
      })
    : // if we already have a result, wrap it so consumers can access it via same API
      data !== undefined
      ? Promise.resolve(data)
      : (promiseOrData as Promise<unknown>);

  const resourceMaxAge = getExpiresAt(
    resource.maxAge ?? DEFAULT_RESOURCE_MAX_AGE
  );

  return {
    promise,
    data,
    expiresAt: prefetch
      ? Math.max(resourceMaxAge, getExpiresAt(DEFAULT_PREFETCH_MAX_AGE))
      : resourceMaxAge,
  };
}
