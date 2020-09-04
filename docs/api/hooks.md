## useResource

The `useResource` hook is the **recommended** way to subscribe route components to their respective resources.

```js
import { useResource } from 'react-resource-router';
import { feedResource } from '../routing/resources';
import { Loading, Error } from './primitives';
import { FeedList } from './FeedList';
import { FeedUpdater } from './FeedUpdater';
import { FeedRefresher } from './FeedRefresher';

export const Feed = () => {
  const [{ data, loading, error, update, refresh }] = useResource(feedResource);

  if (error) {
    return <Error error={error} />;
  }

  if (loading) {
    return <Loading />;
  }

  return (
    <>
      <FeedList items={data} />
      <FeedUpdater onUpdate={update} />
      <FeedRefresher onRefresh={refresh} />
    </>
  );
};
```

It also acceps some options as second argument to customise the behaviour, like `routerContext`.
Check out [this section](/resources/usage) for more details on how to use the `useResource` hook.

## useRouter

You can use the `useRouter` hook to access current [route context](/api/components#routecomponent-props) as well as [router actions](/api/components#routeractions) if required.

```js
import { useRouter, RouterSubscriber, withRouter } from 'react-resource-router';

export const MyRouteComponent = () => {
  const [routerState, routerActions] = useRouter();

  return (
    <MyComponent location={routerState.location} push={routerActions.push} />
  );
};
```

## useRouterActions

You can access [Router Actions](#routeractions) using this hook.

```js
export const RouterActionsHookExample = () => {
  const { push } = useRouterActions();

  return <MyComponent push={push} />;
};
```

## useQueryParam

You can use the `useQueryParam` hook to access the query params in current route.

```js
import { useQueryParam } from 'react-resource-router';

// Current route in address bar — /home/projects?foo=bar

export const MyComponent = () => {
  const [foo, setFoo] = useQueryParam('foo');
  // => foo will have the value 'bar'

  const clickHandler = () => {
    setFoo('baz');
    // => Will update current route to /home/projects?foo=baz
  };

  return (
    <div>
      <p>Hello World!</p>
      <button onClick={clickHandler}>Update param</button>
    </div>
  );
};
```
