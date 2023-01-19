import { LoaderAPI, Route } from '../common/types';

export const entryPointsLoader = (): LoaderAPI<{ entryPoint: unknown }> => {
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
