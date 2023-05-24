import { createRouterSelector } from '../../../index';
import type { RouteWithResources } from '../../common/types';

export const RouteResourceEnabledSubscriber = createRouterSelector(state =>
  Boolean(state.route && (state.route as RouteWithResources).resources)
);
