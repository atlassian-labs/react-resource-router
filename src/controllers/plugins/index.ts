import { History, Plugin, Routes } from '../../common/types';
import { findRouterContext } from '../../common/utils';

export const invokePluginLoad = (
  plugins: Plugin[],
  {
    routes,
    history,
    basePath,
  }: {
    history: History;
    routes: Routes;
    basePath?: string;
  }
) => {
  const context = findRouterContext(routes, {
    location: history.location,
    basePath,
  });

  plugins.forEach(p => {
    p.routeLoad?.({ context });
  });
};
