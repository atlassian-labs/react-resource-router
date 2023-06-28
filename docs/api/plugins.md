## Plugins

Router plugins API allows you to hook into router lifecycle and trigger custom actions when route is loaded/prefetched

```js
import { Router } from 'react-resource-router';
import { App } from './components';
import { appRoutes } from './routing';

const myPlugin = {
    id: 'my-plugin',
    beforeRouteLoad?: ({ 
        context: RouterContext, 
        nextContext: RouterContext,
    }) => { ... },
    routeLoad?: ({ 
        context: RouterContext, 
        prevContext: RouterContext,
    }) => { ... },
    routePrefetch?: ({ 
        context: RouterContext, 
        nextContext: RouterContext,
    }) => { ... },
};

<Router history={...} routes={appRoutes} plugins={[myPlugin]}>
  <App />
</Router>;
```

### API

| method       | type       | description                                                 |
| ---------- | ---------- | ----------------------------------------------------------- |
| `id` | `string`   | [Required] Unique plugin identifier |
| `beforeRouteLoad` | `({ context: RouterContext, nextContext: RouterContext }) => void`   | `beforeRouteLoad` is called before route is loaded, where `context` is current router context (url, query-params, etc) and `nextContext` is next router context |
| `routeLoad`   | `({ context: RouterContext, prevContext: RouterContext }) => void` | `routeLoad` is called after route is loaded, where `context` is current router context (url, query-params, etc) and `prevContext` is previous router context |
| `routePrefetch`   | `({ context: RouterContext, nextContext: RouterContext }) => void` | `routePrefetch` is called when route is prefetched, where `context` is current router context (url, query-params, etc) and `nextContext` is the next route |

## createResourcesPlugin

This plugin is what must be used to create resources for your routes. You can read more about how to create resources [here](./components.md#resources-plugin).


## invokePluginLoad

`invokePluginLoad` allows you to call `routeLoad(...)` method for provided plugins. Useful for [requesting resources in SSR](../router/ssr.md)

```js
import { invokePluginLoad } from 'react-resource-router';

invokePluginLoad([resourcesPlugin], {
    history: createMemoryHistory({ initialEntries: [location] }),
    routes,
    basePath: '...',
});
```

| prop       | type       | description                                                 |
| ---------- | ---------- | ----------------------------------------------------------- |
| `history`  | `History`  | Your application's routes |
| `routes`   | `Routes`   | The history instance for the router, if omitted memory history will be used |
| `basePath?`| `string`   | Base path string that will get prepended to all route paths |
