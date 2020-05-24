import {
  ResourceStoreContext,
  ResourceStoreData,
  RouteResourceResponse,
} from '../../common/types';

import { ResourceSliceIdentifier, State } from './types';
import { getDefaultStateSlice } from './utils';

export const getSliceForResource = (
  state: { data: ResourceStoreData; context?: ResourceStoreContext },
  props: ResourceSliceIdentifier,
): RouteResourceResponse => {
  const { type, key } = props;
  const slice = state.data[type] && state.data[type][key];

  return slice ? { ...slice } : getDefaultStateSlice();
};

export const getResourceStoreContext = (state: State): ResourceStoreContext =>
  state.context;
