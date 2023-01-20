import { Loader, Route } from '../common/types';

export const entryPointsLoader = (): Loader<{ entryPoint: unknown }> => {
  return {
    load: ({ route }: { route: Route }) => {
      return {
        // @ts-expect-error as EntryPoint is missing in Route definition for now
        entryPoint: route.entryPoint,
      };
    },
    prefetch: () => {},
  };
};
