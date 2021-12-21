import React, { Component } from 'react';

import { createPath } from 'history';

import { RouterActionsType, RouterState } from '../router-store/types';
import { RouterSubscriber } from '../subscribers/route';

import { RedirectProps } from './types';
import { generateLocationFromPath } from '../../common/utils';

type RedirectorProps = RedirectProps & {
  actions: RouterActionsType;
  location: RouterState['location'];
};

class Redirector extends Component<RedirectorProps> {
  static defaultProps = {
    push: false,
  };

  componentDidMount() {
    const { to, location, push, params, query, actions } = this.props;
    const routeAttributes = {
      params,
      query,
      basePath: actions.getBasePath() as any,
    };
    const newPath =
      typeof to === 'object'
        ? 'path' in to
          ? createPath(generateLocationFromPath(to.path, routeAttributes))
          : createPath(to)
        : to;
    const currentPath = createPath(location);
    const action = push ? actions.push : actions.replace;

    if (currentPath === newPath) {
      if (
        process.env.NODE_ENV === 'test' ||
        process.env.NODE_ENV === 'development'
      ) {
        // eslint-disable-next-line no-console
        console.warn(
          `You tried to redirect to the same route you're currently on: "${currentPath}"`
        );
      }

      return;
    }

    action(newPath);
  }

  render() {
    return null;
  }
}

export const Redirect = (props: RedirectProps) => (
  <RouterSubscriber>
    {({ location }, actions) => (
      <Redirector actions={actions} location={location} {...props} />
    )}
  </RouterSubscriber>
);
