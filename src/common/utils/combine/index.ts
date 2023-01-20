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
    beforeLoad: (...args) => {
      loaders.forEach(loader => {
        if (loader.beforeLoad !== undefined) {
          loader.beforeLoad(...args);
        }
      });
    },

    load: (...args) => {
      return loaders.reduce(
        (accumulator, loader) => ({
          ...accumulator,
          ...loader.load(...args),
        }),
        {}
      );
    },
    prefetch: (...args) => {
      loaders.forEach(loader => {
        loader.prefetch(...args);
      });
    },
  };
};
