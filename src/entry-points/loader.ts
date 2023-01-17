import { Loader, Route } from '../common/types';

export const entryPointsLoader: Loader = () => {
  return {
    load: ({ route }: { route: Route }) => {
      if (route.entryPoint) {
        // debugger;

        return route.entryPoint; // loadEntryPoint(route.entryPoint, ...)
      }
    },
    prefetch: () => {},
  };
};
