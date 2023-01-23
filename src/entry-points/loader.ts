import { Loader } from '../common/types';

export const entryPointsLoader = (): Loader<{ entryPoint: unknown }> => {
  return {
    load: ({ context: { route } }) => {
      return {
        // @ts-expect-error as EntryPoint is missing in Route definition for now
        entryPoint: route.entryPoint,
      };
    },
    prefetch: () => {},
  };
};
