import React, { Component } from 'react';

import { DEFAULT_HISTORY } from '../../common/constants';
import { createCombinedLoader } from '../loader/index';
import { getRouterState, RouterContainer } from '../router-store';
import { UnlistenHistory } from '../router-store/types';

import { RouterProps } from './types';

import { LoaderAPI } from 'src/common/types';

/**
 * Default prop provider for the RouterContainer.
 *
 */
export class Router extends Component<RouterProps> {
  static defaultProps = {
    isStatic: false,
    isGlobal: true,
    history: DEFAULT_HISTORY,
  };

  loader: LoaderAPI;

  constructor(props: RouterProps) {
    super(props);

    const { resourceContext, resourceData, isStatic } = props;

    this.loader = createCombinedLoader({
      context: resourceContext,
      resourceData,
      isStatic,
    });
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
    if (!this.props.isStatic) {
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
      history,
      initialRoute,
      isStatic,
      isGlobal,
      basePath,
      resourceContext,
      resourceData,
      onPrefetch,
    } = this.props;

    return (
      <RouterContainer
        basePath={basePath}
        routes={routes}
        history={history}
        initialRoute={initialRoute}
        isStatic={isStatic}
        resourceContext={resourceContext}
        resourceData={resourceData}
        onPrefetch={onPrefetch}
        isGlobal={isGlobal}
        loader={this.loader}
      >
        {children}
      </RouterContainer>
    );
  }
}
