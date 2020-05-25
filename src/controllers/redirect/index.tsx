import React, { Component } from 'react';

import { createPath } from 'history';

import { RouterActionsType, RouterState } from '../router-store/types';
import { RouterSubscriber } from '../subscribers/route';

import { RedirectProps } from './types';

type RedirectorProps = RedirectProps & {
  actions: RouterActionsType;
  location: RouterState['location'];
};

class Redirector extends Component<RedirectorProps> {
  static defaultProps = {
    push: false,
  };

  componentDidMount() {
    const { to, location, push, actions } = this.props;
    const newPath = typeof to === 'object' ? createPath(to) : to;
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
    {(
      { location }: { location: RouterState['location'] },
      actions: RouterActionsType
    ) => <Redirector actions={actions} location={location} {...props} />}
  </RouterSubscriber>
);
