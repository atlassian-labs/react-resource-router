export const DEFAULT_RESOURCE_MAX_AGE = 0;
export const DEFAULT_CACHE_MAX_LIMIT = 100;
export const DEFAULT_RESOURCE_IS_BROWSER = false;

/**
 * The base defaults which should be fed into any factory that needs to derive other props.
 */
export const BASE_DEFAULT_STATE_SLICE = {
  data: null,
  error: null,
  loading: false,
  promise: null,
};
