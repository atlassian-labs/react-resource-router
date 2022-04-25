import { StoreActionApi } from 'react-sweet-state';

import {
  ResourceType,
  ResourceKey,
  RouteResourceResponse,
} from '../../../../common/types';

import { State } from '../../types';

export const setResourceState = (
  type: ResourceType,
  key: ResourceKey,
  state: RouteResourceResponse
) => ({ setState, getState }: StoreActionApi<State>) => {
  const { data } = getState();

  setState({
    data: {
      ...data,
      [type]: {
        ...(data[type] || {}),
        [key]: state,
      },
    },
  });
};

export const updateRemoteResourceState = (
  type: ResourceType,
  key: ResourceKey,
  state: RouteResourceResponse
) => ({ dispatch, getState }: StoreActionApi<State>) => {
  const {
    data: { [type]: resourceDataForType },
  } = getState();

  if (resourceDataForType[key]) {
    dispatch(setResourceState(type, key, state));
  }
};

export const deleteResource = (type: ResourceType) => ({
  getState,
  setState,
}: StoreActionApi<State>) => {
  const { data } = getState();
  const { [type]: resourceToBeDeleted, ...rest } = data;

  setState({
    data: rest,
  });
};

export const deleteResourceKey = (key: ResourceKey, type: ResourceType) => ({
  getState,
  setState,
}: StoreActionApi<State>) => {
  const { data } = getState();

  const {
    [type]: { [key]: resourceToBeDeleted, ...rest },
  } = data;

  setState({
    data: {
      ...data,
      [type]: rest,
    },
  });
};
