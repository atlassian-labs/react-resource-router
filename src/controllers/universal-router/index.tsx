import React, { Component } from 'react';

import { DEFAULT_HISTORY } from '../../common/constants';
import { getRouterState, UniversalRouterContainer } from '../router-store';
import { UnlistenHistory } from '../router-store/types';
import { isServerEnvironment } from '../../common/utils';
import { UniversalRouterProps, RequestResourcesParams } from './types';
import { createMemoryHistory, createLocation } from 'history';
import { BrowserHistory } from 'src/common/types';
import { getResourceStore, ResourceContainer } from '../resource-store';
import { getRouterStore } from '../router-store';

const getInferredHistory = (history: BrowserHistory, location?: string) =>
  location ? createMemoryHistory({ initialEntries: [location] }) : history;

/**
 * Default prop provider for the RouterContainer.
 *
 */
export class UniversalRouter extends Component<UniversalRouterProps> {
  static defaultProps = {
    isGlobal: true,
    history: DEFAULT_HISTORY,
  };

  /**
   * The entry point for requesting resource data on the server.
   * Pass the result data into the router as a prop in order to hydrate it.
   * TODO: return type
   */
  static async requestResources(props: RequestResourcesParams) {
    const {
      bootstrapStoreUniversal,
      requestRouteResources,
    } = getRouterStore().actions;
    const { location, ...bootstrapProps } = props;
    const initialEntries = [location];
    const overrides = {
      history: createMemoryHistory({ initialEntries }),
      location: createLocation(location),
    };

    bootstrapStoreUniversal({ ...bootstrapProps, ...overrides });

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
    if (!isServerEnvironment()) {
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
      location,
      resourceContext,
      resourceData,
      isGlobal,
    } = this.props;

    return (
      <UniversalRouterContainer
        routes={routes}
        history={getInferredHistory(history, location)}
        resourceContext={resourceContext}
        resourceData={resourceData}
        isGlobal={isGlobal}
      >
        <ResourceContainer isGlobal={isGlobal}>{children}</ResourceContainer>
      </UniversalRouterContainer>
    );
  }
}
