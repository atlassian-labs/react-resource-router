# How to use Router Resources in your components

Resources expose properties and functions via the [`useResource`](/api/hooks#useresource) hook or the [`ResourceSubscriber`](/api/components#resourcesubscriber), which allow their current state to be accessed or interacted with in your components. These are

| Property  | Type       | Description                                                                             |
| --------- | ---------- | --------------------------------------------------------------------------------------- |
| `data`    | `any`      | The result which your getData function will resolve with                                |
| `loading` | `boolean`  | Determines if the resource is fetching its data or not                                  |
| `error`   | `object`   | error                                                                                   | null | If your getData function throws an error, it will be stored here |
| `update`  | `function` | Allows you to imperatively update the resource's current state bypassing its `maxAge`   |
| `refresh` | `function` | Allows you to imperatively refresh the resource's state by calling its `getData` method |

You can use these properties and functions to implement your own customised render logic inside your resource consuming components.

## Hook

Using resources via the [`useResource`](/api/hooks#useresource) hook is the **recommended** way to access your current resource state in a component. Here is an example of how you can do that

```js
import { useResource } from 'react-resource-router';
import { avatarResource } from '../routing/resources';
import { Circle } from './primitives';

export const Avatar = () => {
  const [{ data, loading }] = useResource(avatarResource);
  const image = loading ? '' : data;

  return <Circle image={image} />;
};
```

## Component

If you are unable to use the [`useResource`](/api/hooks#useresource) hook for whatever reason, you can also use the [`ResourceSubscriber`](/api/components#resourcesubscriber) component which provides your resource state via render props

```js
import { ResourceSubscriber } from 'react-resource-router';
import { avatarResource } from '../routing/resources';
import { Circle } from './primitives';

export class Avatar extends Component {
  render() {
    <ResourceSubscriber>
      {({ data, loading }) => (
        <Circle image={loading ? '' : data} />
      )}
    </ResourceSubscriber>;
  }
}
```
