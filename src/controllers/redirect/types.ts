import { Location, MatchParams, Query, Route } from '../../common/types';

export type RedirectProps = {
  to: Location | Route | string;
  push?: boolean;
  params?: MatchParams;
  query?: Query;
};
