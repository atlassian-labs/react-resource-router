import type { Plugin, CombinedPlugins } from '../../types';

export const combine = (plugins: Plugin[]): CombinedPlugins => {
  return {
    hydrate: () => {
      plugins.forEach(plugin => {
        if (plugin.hydrate !== undefined) {
          plugin.hydrate();
        }
      });
    },
    beforeRouteLoad: (...args) => {
      plugins.forEach(plugin => {
        if (plugin.beforeRouteLoad !== undefined) {
          plugin.beforeRouteLoad(...args);
        }
      });
    },

    loadRoute: (...args) => {
      return plugins.reduce(
        (accumulator, plugin) => ({
          ...accumulator,
          ...plugin.loadRoute(...args),
        }),
        {}
      );
    },
    prefetchRoute: (...args) => {
      plugins.forEach(plugin => {
        plugin.prefetchRoute(...args);
      });
    },
  };
};
