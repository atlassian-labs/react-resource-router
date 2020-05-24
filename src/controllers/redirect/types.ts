import { Location } from '../../common/types';

export type RedirectProps = {
  to: Location | string;
  push?: boolean;
};
