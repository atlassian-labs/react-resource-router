import { Action } from 'react-sweet-state';

import {
  ResourceStoreContext,
  ResourceStoreData,
  RouteResource,
} from '../../common/types';

export type ExecutionTuple = [RouteResource, ResourceAction<any>];
export type ExecutionMaybeTuple = [RouteResource, ResourceAction<any> | null];
export type PrefetchSlice = {
  promise: Promise<unknown>;
  data: unknown;
  expiresAt: number;
};

export type State = {
  data: ResourceStoreData;
  context: ResourceStoreContext;
  executing: ExecutionMaybeTuple[] | null;
  prefetching: Record<string, Record<string, PrefetchSlice | undefined>> | null;
};

// eslint-disable-next-line @typescript-eslint/ban-types
export type ContainerProps = {};

export type ResourceSliceIdentifier = {
  type: string;
  key: string;
};

export type GetResourceOptions = {
  prefetch?: boolean;
  timeout?: number;
  isStatic?: boolean;
};

export type ResourceAction<T> = Action<State, void, T>;
