import type { Plugin } from '../../types';

export const combine = (plugins: Plugin[]): Required<Plugin> => {
  return {
    onHydrate: () => {
      plugins.forEach(plugin => {
        if (plugin.onHydrate !== undefined) {
          plugin.onHydrate();
        }
      });
    },
    onBeforeRouteLoad: (...args) => {
      plugins.forEach(plugin => {
        if (plugin.onBeforeRouteLoad !== undefined) {
          plugin.onBeforeRouteLoad(...args);
        }
      });
    },

    onRouteLoad: (...args) => {
      return plugins.reduce(
        (accumulator, plugin) => ({
          ...accumulator,
          ...(plugin.onRouteLoad !== undefined
            ? plugin.onRouteLoad(...args)
            : {}),
        }),
        {}
      );
    },
    onRoutePrefetch: (...args) => {
      plugins.forEach(plugin => {
        if (plugin.onRoutePrefetch !== undefined) {
          plugin.onRoutePrefetch(...args);
        }
      });
    },
  };
};
