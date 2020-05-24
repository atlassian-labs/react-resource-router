export const DEFAULT_RESOURCE_MAX_AGE: number = 0;

/**
 * The base defaults which should be fed into any factory that needs to derive other props.
 */
export const BASE_DEFAULT_STATE_SLICE = {
  data: null,
  error: null,
  loading: false,
  promise: null,
};
