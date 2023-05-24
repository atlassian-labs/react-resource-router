import { createSubscriber } from 'react-sweet-state';

import {
  RouterStore,
  type EntireRouterState,
  type AllRouterActions,
} from '../../../index';
import type { RouteWithResources } from '../../common/types';

export const RouteResourceEnabledSubscriber = createSubscriber<
  EntireRouterState,
  AllRouterActions,
  boolean
>(RouterStore, {
  selector: state =>
    Boolean(state.route && (state.route as RouteWithResources).resources),
});
