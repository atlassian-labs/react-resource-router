import { createMemoryHistory } from 'history';
import React, { Component } from 'react';

import { BrowserHistory, LoaderAPI } from '../../common/types';
import { combine } from '../../common/utils';
import { createLocation } from '../../common/utils/create-location';
import { entryPointsLoader } from '../../entry-points/loader';
import { resourcesLoader } from '../../resources/loader';
import { getResourceStore, ResourceContainer } from '../resource-store';
import {
  getRouterState,
  getRouterStore,
  UniversalRouterContainer,
} from '../router-store';
import { UnlistenHistory } from '../router-store/types';

import { UniversalRouterProps, RequestResourcesParams } from './types';

/**
 * Default prop provider for the RouterContainer.
 *
 */
export class UniversalRouter extends Component<UniversalRouterProps> {
  static defaultProps = {
    isGlobal: true,
  };

  /**
   * The entry point for requesting resource data on the server.
   * Pass the result data into the router as a prop in order to hydrate it.
   * TODO: return type
   */
  static async requestResources(props: RequestResourcesParams) {
    const { bootstrapStoreUniversal, loadRoute } = getRouterStore().actions;
    const { location, timeout, ...bootstrapProps } = props;
    const initialEntries = [location];
    const overrides = {
      history: createMemoryHistory({ initialEntries }),
      location: createLocation(location),
    };

    const loader = combine(
      entryPointsLoader,
      resourcesLoader
    )({
      context: props.resourceContext,
      resourceData: null,
      timeout,
    });

    bootstrapStoreUniversal({ ...bootstrapProps, ...overrides, loader });

    await loadRoute().resources;

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
  history: BrowserHistory;

  loader: LoaderAPI;

  constructor(props: UniversalRouterProps) {
    super(props);
    const initialEntries = props.location ? [props.location] : [];
    this.history = props.history || createMemoryHistory({ initialEntries });

    const { resourceContext, resourceData } = props;

    this.loader = combine(
      entryPointsLoader,
      resourcesLoader
    )({
      context: resourceContext,
      resourceData,
    });
  }

  componentDidMount() {
    const state = getRouterState();
    this.unlistenHistory = state.unlisten;
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
      resourceContext,
      resourceData,
      isGlobal,
      onPrefetch,
    } = this.props;

    return (
      <UniversalRouterContainer
        routes={routes}
        history={this.history}
        resourceContext={resourceContext}
        resourceData={resourceData}
        isGlobal={isGlobal}
        onPrefetch={onPrefetch}
        loader={this.loader}
      >
        <ResourceContainer isGlobal={isGlobal}>{children}</ResourceContainer>
      </UniversalRouterContainer>
    );
  }
}
