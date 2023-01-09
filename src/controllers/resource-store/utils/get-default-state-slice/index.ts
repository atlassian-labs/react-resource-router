import { RouteResourceResponse } from '../../../../common/types';

import { BASE_DEFAULT_STATE_SLICE } from './constants';

import { getAccessedAt } from '../accessed-at';
import { DEFAULT_RESOURCE_MAX_AGE } from '../create-resource/constants';
import { getExpiresAt } from '../expires-at';

export const getDefaultStateSlice = (): RouteResourceResponse => ({
  ...BASE_DEFAULT_STATE_SLICE,
  expiresAt: getExpiresAt(DEFAULT_RESOURCE_MAX_AGE),
  accessedAt: getAccessedAt(),
});
