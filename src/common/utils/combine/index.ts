import type { Loader, CombinedLoader } from '../../types';

export const combine = (...loaders: Loader[]): CombinedLoader => {
  return {
    hydrate: () => {
      loaders.forEach(loader => {
        if (loader.hydrate !== undefined) {
          loader.hydrate();
        }
      });
    },
    beforeLoad: params => {
      loaders.forEach(loader => {
        if (loader.beforeLoad !== undefined) {
          loader.beforeLoad(params);
        }
      });
    },

    load: loadParams => {
      return loaders.reduce(
        (accumulator, loader) => ({
          ...accumulator,
          ...loader.load(loadParams),
        }),
        {}
      );
    },
    prefetch: prefetchParams => {
      loaders.forEach(loader => {
        loader.prefetch(prefetchParams);
      });
    },
  };
};
