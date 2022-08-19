import { StoreActionApi } from 'react-sweet-state';

import {
  ResourceType,
  ResourceKey,
  RouteResourceResponse,
} from '../../../../common/types';

import { State } from '../../types';

export const setResourceState =
  (type: ResourceType, key: ResourceKey, state: RouteResourceResponse) =>
  ({ setState, getState }: StoreActionApi<State>) => {
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

export const getResourceState =
  (type: ResourceType, key: ResourceKey) =>
  ({ getState }: StoreActionApi<State>) => {
    const {
      data: { [type]: resourceDataForType },
    } = getState();

    return resourceDataForType?.[key];
  };

export const deleteResourceState =
  (type: ResourceType, key?: ResourceKey) =>
  ({ getState, setState }: StoreActionApi<State>) => {
    const { data } = getState();
    const { [type]: resourceForType, ...remainingData } = data;

    if (key === undefined) {
      setState({
        data: remainingData,
      });
    } else if (resourceForType) {
      const { [key]: _, ...remainingForType } = resourceForType;
      setState({
        data: {
          ...remainingData,
          [type]: remainingForType,
        },
      });
    }
  };
