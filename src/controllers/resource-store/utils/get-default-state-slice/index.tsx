import { RouteResourceResponse } from '../../../../common/types';
import {
  BASE_DEFAULT_STATE_SLICE,
  DEFAULT_RESOURCE_MAX_AGE,
} from '../../constants';
import { getExpiresAt } from '../expires-at';

export const getDefaultStateSlice = (): RouteResourceResponse => ({
  ...BASE_DEFAULT_STATE_SLICE,
  expiresAt: getExpiresAt(DEFAULT_RESOURCE_MAX_AGE),
});
