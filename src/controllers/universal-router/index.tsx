import React, { Component } from 'react';

import { DEFAULT_HISTORY } from '../../common/constants';
import { getRouterState, RouterContainer } from '../router-store';
import { UnlistenHistory } from '../router-store/types';
import { isNodeEnvironment } from '../../common/utils';
import { UniversalRouterProps, RequestResourcesParams } from './types';
import { createMemoryHistory, createLocation } from 'history';
import { BrowserHistory } from 'src/common/types';
import { getResourceStore } from '../resource-store';
import { getRouterStore } from '../router-store';

const getIsStaticRouter = (isStatic?: boolean) =>
  isStatic === undefined ? isNodeEnvironment() : isStatic;

const getInferredHistory = (history: BrowserHistory, location?: string) =>
  location ? createMemoryHistory({ initialEntries: [location] }) : history;

/**
 * Default prop provider for the RouterContainer.
 *
 */
export class UniversalRouter extends Component<UniversalRouterProps> {
  static defaultProps = {
    isStatic: false,
    history: DEFAULT_HISTORY,
  };

  /**
   * The entry point for requesting resource data on the server.
   * Pass the result data into the router as a prop in order to hydrate it.
   * TODO: return type
   */
  static async requestResources(props: RequestResourcesParams) {
    const { bootstrapStore, requestRouteResources } = getRouterStore().actions;
    const { location, ...bootstrapProps } = props;
    const initialEntries = [location];
    const overrides = {
      history: createMemoryHistory({ initialEntries }),
      location: createLocation(location),
      isStatic: true,
    };

    bootstrapStore({ ...bootstrapProps, ...overrides });

    await requestRouteResources();

    return getResourceStore().actions.getSafeData();
  }

  /**
   * Keep a copy of the history listener so that we can be sure that
   * on unmount we call the listener that was in the router store at the
   * time of mounting.
   *
   * This prevents an issue where the wrong listener is removed if the router
   * is re-mounted.
   */
  unlistenHistory: UnlistenHistory | null = null;

  componentDidMount() {
    if (!getIsStaticRouter(this.props.isStatic)) {
      const state = getRouterState();
      this.unlistenHistory = state.unlisten;
    }
  }

  /**
   * Ensures that the router store stops listening to history when the Router
   * is unmounted.
   */
  componentWillUnmount() {
    if (this.unlistenHistory) {
      this.unlistenHistory();
    }
  }

  render() {
    const {
      children,
      routes,
      history = DEFAULT_HISTORY,
      isStatic,
      location,
      resourceContext,
      resourceData,
    } = this.props;

    return (
      <RouterContainer
        routes={routes}
        history={getInferredHistory(history, location)}
        isStatic={getIsStaticRouter(isStatic)}
        resourceContext={resourceContext}
        resourceData={resourceData}
        isGlobal
      >
        {children}
      </RouterContainer>
    );
  }
}
