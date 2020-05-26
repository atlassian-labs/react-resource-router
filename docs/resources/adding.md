# How to add resources to your route

Adding resources to your route is as simple as importing them in your app routes file and adding them to the `resources` array for the route they are required for.

For example:

```js
// app-routes.js
import { accountInfoResource, avatarResource } from './resources';
import { UserProfile } from '../components';

export const routes = [
  {
    path: '/user/profile/:id',
    component: UserProfile,
    resources: [accountInfoResource, avatarResource],
  },
];
```

Here we have two resources being used for the dynamic user profile route. When the router mounts and matches this route, the `resources` here will all begin to fetch their data and the `UserProfile` component will be updated accordingly if it uses the [`useResource`](/api/hooks#useresource) hook or the [`ResourceSubscriber`](/api/components#resourcesubscriber) component internally.
