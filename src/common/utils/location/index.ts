import { createLocation, Location as HistoryLocation } from 'history';

import { Location } from '../../types';

export const normalizeToLocation = (
  to: string | Location,
  currentLocation: Location,
): Location =>
  typeof to === 'string'
    ? createLocation(to, null, '', currentLocation as HistoryLocation)
    : to;
