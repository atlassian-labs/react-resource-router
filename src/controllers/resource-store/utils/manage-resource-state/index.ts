import { StoreActionApi } from 'react-sweet-state';

import { RouteResource, RouteResourceResponse } from '../../../../common/types';

import { State } from '../../types';

export const setResourceState = (
  type: RouteResource['type'],
  key: string,
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
  type: RouteResource['type'],
  key: string,
  state: RouteResourceResponse
) => ({ dispatch, getState }: StoreActionApi<State>) => {
  const {
    data: { [type]: resourceDataForType },
  } = getState();

  if (resourceDataForType[key]) {
    dispatch(setResourceState(type, key, state));
  }
};

export const deleteResource = (type: RouteResource['type']) => ({
  getState,
  setState,
}: StoreActionApi<State>) => {
  const { data } = getState();
  const { [type]: resourceToBeDeleted, ...rest } = data;

  setState({
    data: rest,
  });
};

export const deleteResourceKey = (
  key: string,
  type: RouteResource['type']
) => ({ getState, setState }: StoreActionApi<State>) => {
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
