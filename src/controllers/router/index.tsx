import React, { Component } from 'react';

import { DEFAULT_HISTORY } from '../../common/constants';
import { getRouterState, RouterContainer } from '../router-store';
import { UnlistenHistory } from '../router-store/types';

import { RouterProps } from './types';

/**
 * Default prop provider for the RouterContainer.
 *
 */
export class Router extends Component<RouterProps> {
  static defaultProps = {
    isStatic: false,
    history: DEFAULT_HISTORY,
  };

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
      basePath,
      resourceContext,
      resourceData,
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
        isGlobal
      >
        {children}
      </RouterContainer>
    );
  }
}
