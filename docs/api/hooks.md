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

You can use the `useQueryParam` hook to access the query params in current route. Pass in `undefined` to remove a query param from the url.

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

## usePathParam

You can use the `usePathParam` hook to access the path params in current route. Pass in `undefined` to remove an [optional param](https://github.com/pillarjs/path-to-regexp#optional) from the url.

```js
import { usePathParam } from 'react-resource-router';

// path — /projects/:projectId/board/:boardId

// Current route in address bar — /projects/123/board/456?foo=bar

export const MyComponent = () => {
  const [projectId, setProjectId] = usePathParam('projectId');
  // => projectId will have the value '123'

  const clickHandler = () => {
    setProjectId('222');
    // => Will update current route to /projects/222/board/456?foo=bar
  };

  return (
    <div>
      <p>Hello World!</p>
      <button onClick={clickHandler}>Update param</button>
    </div>
  );
};
```
