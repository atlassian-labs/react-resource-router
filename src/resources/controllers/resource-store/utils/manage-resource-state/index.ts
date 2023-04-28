import { StoreActionApi } from 'react-sweet-state';

import {
  ResourceType,
  ResourceKey,
  RouteResourceResponse,
} from '../../../../../common/types';
import { PrefetchSlice, State } from '../../types';

export const getPrefetchSlice =
  (type: ResourceType, key: ResourceKey) =>
  ({ getState }: StoreActionApi<State>) => {
    const { prefetching } = getState();
    const slice = prefetching?.[type]?.[key];

    // check if slice is still fresh
    if (slice && Date.now() < Number(slice.expiresAt)) {
      return slice;
    }

    return undefined;
  };

export const setPrefetchSlice =
  (type: ResourceType, key: ResourceKey, slice: PrefetchSlice | undefined) =>
  ({ setState, getState }: StoreActionApi<State>) => {
    const { prefetching } = getState();
    // avoid doing extra set if same value
    if (prefetching?.[type]?.[key] === slice) return;

    // cheap optimisation to provide prefetched result syncronously
    slice?.promise?.then(maybeData => (slice.data = maybeData));

    setState({
      prefetching: {
        ...prefetching,
        [type]: { ...prefetching?.[type], [key]: slice },
      },
    });
  };

export const setResourceState =
  (type: ResourceType, key: ResourceKey, state: RouteResourceResponse) =>
  ({ setState, getState, dispatch }: StoreActionApi<State>) => {
    const { data } = getState();
    // every time we override a resource we kill its prefetched
    dispatch(setPrefetchSlice(type, key, undefined));

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
