import type {
  LoaderAPI,
  RouterContext,
  RouteResourceResponse,
} from '../../types';

type CombinedLoaderAPI<T> = {
  hydrate: () => void;
  onBeforeRouteChange: (params: {
    prevLocationContext: RouterContext;
    nextLocationContext: RouterContext;
  }) => void;
  load: (
    context: RouterContext & {
      prevLocationContext?: RouterContext;
    }
  ) => T;
  prefetch: (context: RouterContext) => void;
};

type LoadResult = {
  resources: Promise<RouteResourceResponse<unknown>[]>;
  entryPoint: any; // TODO: add proper type when implementing EntryPoints
};

export const combine = (
  ...loaders: LoaderAPI[]
): CombinedLoaderAPI<LoadResult> => {
  return {
    hydrate: () => {
      loaders.forEach(loader => {
        if (loader.hydrate !== undefined) {
          loader.hydrate();
        }
      });
    },
    onBeforeRouteChange: params => {
      loaders.forEach(loader => {
        if (loader.onBeforeRouteChange !== undefined) {
          loader.onBeforeRouteChange(params);
        }
      });
    },

    load: loadParams => {
      return loaders.reduce(
        (accumulator, loader) => ({
          ...accumulator,
          ...loader.load(loadParams),
        }),
        {} as LoadResult
      );
    },
    prefetch: prefetchParams => {
      loaders.forEach(loader => {
        loader.prefetch(prefetchParams);
      });
    },
  };
};
