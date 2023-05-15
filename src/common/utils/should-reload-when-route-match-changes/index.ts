import { ShouldReloadFunction } from '../../types';

type Options = {
  query?: string[];
  params?: string[];
};
export const shouldReloadWhenRouteMatchChanges =
  (options: Options) =>
  ({ context, prevContext }: Parameters<ShouldReloadFunction>[0]) => {
    if (
      options?.query !== undefined &&
      options?.query.some(
        q => context.match.query[q] !== prevContext.match.query[q]
      )
    ) {
      return true;
    }

    if (
      options?.params !== undefined &&
      options?.params.some(
        p => context.match.params[p] !== prevContext.match.params[p]
      )
    ) {
      return true;
    }

    return false;
  };
