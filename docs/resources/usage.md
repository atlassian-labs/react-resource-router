# How to use Router Resources in your components

Resources expose properties and functions via the [`useResource`](../api/hooks.md#useresource) hook or the [`ResourceSubscriber`](../api/components.md#resourcesubscriber), which allow their current state to be accessed or interacted with in your components. These are

| Property  | Type              | Description                                                                             |
| --------- | ----------------- | --------------------------------------------------------------------------------------- |
| `data`    | `any`             | The result which your getData function will resolve with                                |
| `loading` | `boolean`         | Determines if the resource is fetching its data or not                                  |
| `error`   | `error` or `null` | If your getData function throws an error, it will be stored here                        |
| `update`  | `function`        | Allows you to imperatively update the resource's current state bypassing its `maxAge`   |
| `refresh` | `function`        | Allows you to imperatively refresh the resource's state by calling its `getData` method |
| `clear`   | `function`        | Allows you to imperatively clear the resource's state                                   |
| `key`     | `string`          | Unique key for the resource                                                             |

You can use these properties and functions to implement your own customised render logic inside your resource consuming components.

## Hook

Using resources via the [`useResource`](../api/hooks.md#useresource) hook is the **recommended** way to access your current resource state in a component. Here is an example of how you can do that

```jsx
import { useResource } from 'react-resource-router';
import { avatarResource } from '../routing/resources';
import { Circle } from './primitives';

export const Avatar = () => {
  const { data, loading } = useResource(avatarResource);
  const image = loading ? '' : data;

  return <Circle image={image} />;
};
```

## Component

If you are unable to use the [`useResource`](../api/hooks.md#useresource) hook for whatever reason, you can also use the [`ResourceSubscriber`](../api/components.md#resourcesubscriber) component which provides your resource state via render props

```jsx
import { ResourceSubscriber } from 'react-resource-router';
import { avatarResource } from '../routing/resources';
import { Circle } from './primitives';

export class Avatar extends Component {
  render() {
    <ResourceSubscriber>
      {({ data, loading }) => <Circle image={loading ? '' : data} />}
    </ResourceSubscriber>;
  }
}
```

## Accessing resource state for another route or url

By default, the hook and the subscriber access data and state of a resource given current router context. So if your resource key is based on some parameters for instance, the resource state will be bound to such key and the hooks/subscribers will calculate it based on current router state.

There are situations however, where you might want to access a different key for a resource, like to triggering an ahead of time fetch, refresh or just invalidating data. For this reasons the hooks/subscribers accept an optional `routerContext` that will be passed to `getData` and `getKey`.

As an example, assuming your `blogPostRoute` has path `/blogs/:id` and you are on `/`, you can populate the resurce of blog `id: 1` by creating a custom `routerContext`:

```jsx
import { useResource, createRouterContext } from 'react-resource-router';
import { blogPostResource } from '../routing/resources';
import { blogPostRoute } from '../routing';

export const PrefetchBlogPost = ({ id }) => {
  const { refresh } = useResource(blogPostResource, {
    routerContext: createRouterContext(blogPostRoute, { params: { id } }),
  });

  useEffect(() => {
    refresh();
  }, [refresh]);

  return null;
};
```
