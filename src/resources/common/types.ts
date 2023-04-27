import type { RouterContext } from '../../index';

export type RouteResourceLoading = boolean;

export type RouteResourceTimestamp = number | null;

export type RouteResourceError = Record<string, any> | Error;

export type RouteResourceDataPayload = Record<string, any>;

export type RouteResourceUpdater<RouteResourceData = unknown> = (
  data: RouteResourceData
) => RouteResourceData;

export type EmptyObject = {
  [K in any]: never;
};

export type RouteResourceSyncResult<RouteResourceData> =
  | {
      data: RouteResourceData;
      error: null;
      loading: true;
      // promise: existing value retained
    }
  | {
      data: RouteResourceData;
      error: null;
      loading: false;
      promise: Promise<RouteResourceData>;
    };

export type RouteResourceAsyncResult<RouteResourceData> =
  | {
      data: RouteResourceData;
      error: null;
      loading: false;
      promise: Promise<RouteResourceData>;
    }
  | {
      // data: existing value retained
      error: RouteResourceError;
      loading: false;
      promise: Promise<RouteResourceData>;
    }
  | {
      // data: existing value retained
      error: RouteResourceError;
      loading: true;
      promise: null;
    };

type RouteResourceResponseBase<RouteResourceData> = {
  key?: string;
  loading: RouteResourceLoading;
  error: RouteResourceError | null;
  data: RouteResourceData | null;
  promise: Promise<RouteResourceData> | null;
  expiresAt: RouteResourceTimestamp;
  accessedAt: RouteResourceTimestamp;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type RouteResourceResponseInitial<RouteResourceData> = {
  loading: false;
  error: null;
  data: null;
  promise: null;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type RouteResourceResponseLoading<RouteResourceData> = {
  loading: true;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type RouteResourceResponseError<RouteResourceData> = {
  loading: false;
  error: RouteResourceError;
};

export type RouteResourceResponseLoaded<RouteResourceData> = {
  loading: false;
  error: null;
  data: RouteResourceData;
};

export type RouteResourceResponse<RouteResourceData = unknown> =
  RouteResourceResponseBase<RouteResourceData> &
    (
      | RouteResourceResponseInitial<RouteResourceData>
      | RouteResourceResponseLoading<RouteResourceData>
      | RouteResourceResponseError<RouteResourceData>
      | RouteResourceResponseLoaded<RouteResourceData>
    );

export type ResourceDependencies = {
  [type: string]: RouteResourceResponse | undefined;
};

export type RouterDataContext = RouterContext & {
  isPrefetch: boolean;
  dependencies: ResourceDependencies;
};

export type UseResourceHookResponse<RouteResourceData> =
  RouteResourceResponse<RouteResourceData> & {
    update: (getNewData: RouteResourceUpdater<RouteResourceData>) => void;
    refresh: () => void;
    clear: () => void;
    clearAll: () => void;
  };

export type ResourceType = string;
export type ResourceKey = string;

export type RouteResource<T extends unknown = unknown> = {
  type: ResourceType;
  getKey: (
    routerContext: RouterContext,
    customContext: ResourceStoreContext
  ) => ResourceKey;
  maxAge: number;
  getData: (
    routerContext: RouterDataContext,
    customContext: ResourceStoreContext
  ) => T | Promise<T>;
  maxCache: number;
  isBrowserOnly: boolean;
  depends: ResourceType[] | null;
};

export type RouteResources = RouteResource[];

export interface ResourceStoreContext {}

export type RouteResourceDataForType = Record<
  string,
  RouteResourceResponse<unknown>
>;

export type ResourceStoreData = Record<string, RouteResourceDataForType>;
