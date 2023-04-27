import { createMemoryHistory } from 'history';
import React, { useMemo, useEffect } from 'react';

import { invokePluginLoad } from '../../controllers/plugins/index';
import { createResourcesPlugin } from '../../resources/plugin';
import { getRouterState, RouterContainer } from '../router-store';

import {
  RouterProps,
  MemoryRouterProps,
  RequestResourcesParams,
} from './types';

export const Router = ({
  basePath,
  children,
  history,
  initialRoute,
  isGlobal = true,
  plugins,
  onPrefetch,
  resourceContext,
  resourceData,
  routes,
}: RouterProps) => {
  useEffect(() => {
    const { unlisten } = getRouterState();

    return () => {
      unlisten && unlisten();
    };
  }, []);

  const pluginsWithFallback = useMemo(() => {
    if (plugins) return plugins;

    // default 'plugins' fallback for the first relase
    const resourcesPlugin = createResourcesPlugin({
      context: resourceContext,
      resourceData,
    });

    return [resourcesPlugin];
  }, [resourceContext, resourceData, plugins]);

  return (
    // <ResourceContainer isGlobal>
    <RouterContainer
      basePath={basePath}
      history={history}
      initialRoute={initialRoute}
      isGlobal={isGlobal}
      onPrefetch={onPrefetch}
      plugins={pluginsWithFallback}
      resourceContext={resourceContext}
      resourceData={resourceData}
      routes={routes}
    >
      {children}
    </RouterContainer>
    // </ResourceContainer>
  );
};

/**
 * @deprecated
 * The entry point for requesting resource data on the server.
 * Pass the result data into the router as a prop in order to hydrate it.
 */
Router.requestResources = async ({
  location,
  history,
  timeout,
  routes,
  resourceContext: context,
}: RequestResourcesParams) => {
  const resourcesPlugin = createResourcesPlugin({
    context,
    resourceData: null,
    timeout,
  });

  const plugins = [resourcesPlugin];

  invokePluginLoad(plugins, {
    history: history || createMemoryHistory({ initialEntries: [location] }),
    routes: routes,
  });

  return await resourcesPlugin.getSerializedResources();
};

export function MemoryRouter(props: MemoryRouterProps) {
  const history = useMemo(
    () =>
      createMemoryHistory(
        props.location ? { initialEntries: [props.location] } : {}
      ),
    [props.location]
  );

  return <Router {...props} history={history} isGlobal={false} />;
}
