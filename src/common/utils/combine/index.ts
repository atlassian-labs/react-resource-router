import type { Plugin } from '../../types';

export const combine = (plugins: Plugin[]): Required<Plugin> => {
  return {
    onHydrate: () => {
      plugins.forEach(plugin => {
        if (plugin.onHydrate != null) {
          plugin.onHydrate();
        }
      });
    },
    onBeforeRouteLoad: (...args) => {
      plugins.forEach(plugin => {
        if (plugin.onBeforeRouteLoad != null) {
          plugin.onBeforeRouteLoad(...args);
        }
      });
    },

    onRouteLoad: (...args) => {
      return plugins.reduce(
        (accumulator, plugin) => ({
          ...accumulator,
          ...(plugin.onRouteLoad != null ? plugin.onRouteLoad(...args) : {}),
        }),
        {}
      );
    },
    onRoutePrefetch: (...args) => {
      plugins.forEach(plugin => {
        if (plugin.onRoutePrefetch != null) {
          plugin.onRoutePrefetch(...args);
        }
      });
    },
  };
};
