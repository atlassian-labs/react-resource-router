import { ShouldReloadFunction } from '../../types';

type Options = {
  query?: string[];
  params?: string[];
};
export const shouldReloadWhenRouteMatchChanges =
  ({ params = [], query = [] }: Options) =>
  ({ context, prevContext }: Parameters<ShouldReloadFunction>[0]) => {
    return (
      params.some(
        p => context.match.params[p] !== prevContext.match.params[p]
      ) ||
      query.some(q => context.match.query[q] !== prevContext.match.query[q])
    );
  };
