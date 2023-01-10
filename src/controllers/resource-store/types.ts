import { Action, StoreActionApi } from 'react-sweet-state';

import {
  ResourceStoreContext,
  ResourceStoreData,
  RouteResource,
  RouteResourceResponse,
  RouteResourceUpdater,
  RouterContext,
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

export type HydratableState = {
  resourceData?: ResourceStoreData;
  resourceContext?: ResourceStoreContext;
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

export type Actions = {
  clearResource: (
    resource: RouteResource,
    routerStoreContext?: RouterContext
  ) => ResourceAction<void>;
  updateResourceState: (
    resource: RouteResource,
    routerStoreContext: RouterContext,
    getNewSliceData: RouteResourceUpdater
  ) => ResourceAction<void>;
  getResource: (
    resource: RouteResource,
    routerStoreContext: RouterContext,
    options: GetResourceOptions
  ) => ResourceAction<Promise<RouteResourceResponse>>;
  getResourceFromRemote: (
    resource: RouteResource,
    routerStoreContext: RouterContext,
    options: GetResourceOptions
  ) => ResourceAction<Promise<RouteResourceResponse>>;
  requestAllResources: (
    routerStoreContext: RouterContext,
    options?: GetResourceOptions
  ) => ResourceAction<Promise<RouteResourceResponse[]>>;
  cleanExpiredResources: (
    resources: RouteResource[],
    routerStoreContext: RouterContext
  ) => ResourceAction<void>;
  requestResources: (
    resources: RouteResource[],
    routerStoreContext: RouterContext,
    options: GetResourceOptions
  ) => ResourceAction<Promise<RouteResourceResponse>[]>;
  prefetchResources: (
    resources: RouteResource[],
    routerStoreContext: RouterContext,
    options: GetResourceOptions
  ) => ResourceAction<Promise<void>[]>;
  hydrate: (
    state: HydratableState
  ) => ({ getState, setState }: StoreActionApi<State>) => void;
  getContext: () => ({
    setState,
    getState,
  }: StoreActionApi<State>) => ResourceStoreContext;
  getSafeData: () => ({
    setState,
    getState,
  }: StoreActionApi<State>) => ResourceStoreData;
};
