# How to interact with Router Resources

After the Router has mounted, your data has been fetched and your route component has rendered, you may need to interact with your resources in order to keep them up to date or to have them respond to certain user actions. In order to achieve this, in addition to the current resource state, both the [`useResource`](/api/hooks#useresource) hook and [`ResourceSubscriber`](/api/components#resourcesubscriber) provide `update` and `refresh` functions for you to use in your components. Let's take a look at how these work.

## Updating

The `update` method takes a callback function as a parameter, which will be called with the current state of the resource and should return the updated state.

Calling this function will replace the data property of the resource and set the `expiresAt` value, according the to the `maxAge` of the resource.

```js
import { useResource } from 'react-resource-router';
import { accountInfoResource } from '../routing/resources';

export const UsernameUpdater = ({ newUsername }) => {
  const [{ update }] = useResource(accountInfoResource);
  const updateUsername = () =>
    update(currentData => ({
      ...currentData,
      username: newUsername,
    }));

  return (
    <button onClick={updateUsername}>
      Update your username to {newUsername}
    </button>
  );
};
```

## Refreshing

The refresh function is bound to the resource that you provide to [`useResource`](/api/hooks#useresource) hook or the [`ResourceSubscriber`](/api/components#resourcesubscriber). Calling this function will cause the router to call the `getData` function on your resource, and bypass any `expiresAt` checks.

When using the `refresh` function, the resource will always be fetched from remote and the resource state will be updated with any result, including errors.

```js
import { useResource } from 'react-resource-router';
import { accountInfoResource } from '../routing/resources';

export const UsernameResetter = ({ newUsername }) => {
  const [{ data, refresh }] = useResource(accountInfoResource);

  return (
    <button onClick={() => refresh()}>
      Reset your username to {data.username}
    </button>
  );
};
```
