# How to create Router Resources

Resources should always be created using the `createResource` helper function like so

```js
import { createResource } from 'react-resource-router';

export const userProfileResource = createResource({
  type: 'USER_PROFILE',
  getKey: () => 'username',
  getData: (_, { user }) => fetch('https://my-app.com/api?user=username'),
});
```

`createResource` takes in a configuration object that should contain the following properties.

| Property        | type                                                     | Description                                                                                                                                                                                                                                                                                                                          |
| --------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `type`          | `string`                                                 | Used as a namespace for this resource. Each resource should have a unique type                                                                                                                                                                                                                                                       |
| `getKey`        | `(routerContext, customContext) => string`               | The return value of this function is used to identify this resource within the `type` namespace. The function itself is supplied with `routerContext` and `customContext` so that the composition of keys can use this data if required                                                                                              |
| `getData`       | `(routerExtendedContext, customContext) => Promise<any>` | This function is used to load the data for the resource. The function should return a promise and resolve with the resource data object. NOTE: You may not use `getData` and `getDataLoader` on the same resource                                                                                                                    |
| `maxAge`        | `number`                                                 | How long (in milliseconds) the resource should be kept in the router before a fresh resource is retrieved. Note: resources are only refreshed on route _change_. The router does not poll or update resources in the background. Navigation within the same route, e.g. query param change, will not trigger a refresh of resources. |
| `maxCache` | `number`                      | How many resources can be kept in the router for a particular `type`. Once the threshold limit is reached, a **Least Recently** used resource gets deleted, making space for the new requested resource of the same type.                                                                                                                                         |
| `getDataLoader` | `() => Promise<{default: getData}>`                      | Optional property that enables neater code splitting. See more below. NOTE: You may not use `getData` and `getDataLoader` on the same resource                                                                                                                                                                                       |