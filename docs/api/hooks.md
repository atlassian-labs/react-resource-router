## useResource

The `useResource` hook is the **recommended** way to subscribe route components to their respective resources.

```js
import { useResource } from 'react-resource-router';
import { feedResource } from '../routing/resources';
import { Loading, Error } from './primitives';
import { FeedList } from './FeedList';
import { FeedUpdater } from './FeedUpdater';
import { FeedRefresher } from './FeedRefresher';
import { FeedClearance } from './FeedCleaner';

export const Feed = () => {
  const { data, loading, error, update, refresh, clear } = useResource(feedResource);

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
      <FeedClearance onClear={clear} />
    </>
  );
};
```

As well as returning actions that act on the resource (i.e. update and refresh), `useResource` returns four different properties that indicate the state of the resource. These four are `data`, `loading`, `error` and `promise`. `useResource` will return different combinations of these four properties depending on the state of the resource. The table below shows all the possible combinations.

|       state        |   data   | loading |    error     |              promise              |
| :----------------: | :------: | :-----: | :----------: | :-------------------------------: |
|      initial       |   null   |  false  |     null     |               null                |
|  data (from SSR)   |    {}    |  false  |     null     |     Promise (resolves `data`)     |
| timeout (from SSR) |   null   |  true   | TimeoutError |               null                |
|   async loading    | _-prev-_ |  true   |   _-prev-_   |         Promise (pending)         |
|  async successful  |    {}    |  false  |     null     |     Promise (resolves `data`)     |
|    async error     | _-prev-_ |  false  |    Error     |     Promise (rejects `error`)     |
|      cleared       |   null   |  false  |     null     |               null                |
|     updated {}     |    {}    |  false  |     null     | Promise (resolves updated `data`) |

Where `-prev-` indicates the field will remain unchanged from any previous state, possibly the inital state.

It is important to note 
* The timeout state is essentially a hung loading state, with the difference that `promise = null` and `error != null`. Developers should give priority to `loading` when deciding between loading or error states for their components. Promises/errors should only ever be thrown on the client.
* The `promise` reflects the last operation, either async or explicit update. Update will clear `error`, set `data`. It will also set a `promise` consistent with that `data` so long as no async is `loading`. When `loading` the `promise` will always reflect the future `data` or `error` from the pending async. 

Additionaly `useResource` accepts additional arguments to customise behaviour, like `routerContext`.
Check out [this section](../resources/usage.md) for more details on how to use the `useResource` hook.

## useRouter

You can use the `useRouter` hook to access current [route context](./components.md#routecomponent-props) as well as [router actions](./components.md#routeractions) if required.

```js
import { useRouter, RouterSubscriber, withRouter } from 'react-resource-router';

export const MyRouteComponent = () => {
  const [routerState, routerActions] = useRouter();

  return (
    <MyComponent location={routerState.location} push={routerActions.push} />
  );
};
```

## createRouterSelector

If you are worried about `useRouter` re-rendering too much, you can create custom router hooks using selectors that will trigger a re-render only when the selector output changes.  
To access/manipulate path or query parameters we still recommend using `usePathParam` or `useQueryParam`, as they provide a simplified interface for that url data.
Also note that this utility will only return state, without actions. To access actions, combine it with [useRouterActions](#userouteractions).

```js
import { createRouterSelector } from 'react-resource-router';

const useRouteName = createRouterSelector(o => o.route.name);

export const MyRouteComponent = () => {
  const routeName = useRouteName();

  return <MyComponent currentRouteName={routeName} push={routerActions.push} />;
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

The setter takes two arguments, `(newValue, updateType)` where `updateType` is `'push' | 'replace'` defaulting to `'push'` if not provided.

```js
import { useQueryParam } from 'react-resource-router';

// Current route in address bar — /home/projects?foo=bar

export const MyComponent = () => {
  const [foo, setFoo] = useQueryParam('foo');
  // => foo will have the value 'bar'

  const pushClickHandler = () => {
    setFoo('baz'); // equivalent to setFoo('baz', 'push')
    // => Will push current route /home/projects?foo=bar (can use back button)
  };

  const replaceClickHandler = () => {
    setFoo('qux', 'replace');
    // => Will replace current route to /home/projects?foo=qux
  };

  return (
    <div>
      <p>Hello World!</p>
      <button onClick={pushClickHandler}>Push param</button>
      <button onClick={replaceClickHandler}>Replace param</button>
    </div>
  );
};
```

## usePathParam

You can use the `usePathParam` hook to access the path params in current route. Pass in `undefined` to remove an [optional param](https://github.com/pillarjs/path-to-regexp#optional) from the url.

The setter takes two arguments, `(newValue, updateType)` where `updateType` is `'push' | 'replace'` defaulting to `'push'` if not provided.

```js
import { usePathParam } from 'react-resource-router';

// path — /projects/:projectId/board/:boardId

// Current route in address bar — /projects/123/board/456?foo=bar

export const MyComponent = () => {
  const [projectId, setProjectId] = usePathParam('projectId');
  // => projectId will have the value '123'

  const pushClickHandler = () => {
    setProjectId('222'); // equivalent to setProject('222', 'push')
    // => Will push current route /projects/222/board/456?foo=bar (can use back button)
  };

  const replaceClickHandler = () => {
    setProjectId('333', 'replace');
    // => Will relace current route to /projects/333/board/456?foo=bar
  };

  return (
    <div>
      <p>Hello World!</p>
      <button onClick={clickHandler}>Update param</button>
    </div>
  );
};
```
