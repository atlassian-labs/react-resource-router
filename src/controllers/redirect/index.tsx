import { createPath } from 'history';
import React, { Component } from 'react';

import { Location, MatchParams, Query, Route } from '../../common/types';
import { generateLocationFromPath } from '../../common/utils';

import { RouterActionsType, RouterState } from '../router-store/types';
import { useRouter } from '../use-router';

export type RedirectProps = {
  to: Location | Route | string;
  push?: boolean;
  params?: MatchParams;
  query?: Query;
};

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
      basePath: actions.getBasePath(),
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

export const Redirect = (props: RedirectProps) => {
  const [{ location }, actions] = useRouter();

  return <Redirector actions={actions} location={location} {...props} />;
};
