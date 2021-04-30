# Router state

## Accessing Router State

Current router state is accessible through the [`useRouter`](/api/hooks#userouter) hook, the [`RouterSubscriber`](/api/components#routersubscriber-component) component or the [`withRouter`](/api/components#withrouter) higher order component. We recommend using the hook or subscriber, as the HoC is provided in order to assist in migrating away from `react-router` if this is needed.

## Interacting With History

In order to imperatively change routes in your application, for example directing the user to the `login` page after they have hit the `logout` button, you can use the [`useRouterActions`](/api/hooks#userouteractions) hook or the [`RouterActions`](/api/components#routeractions) component. These both expose a number of methods to safely allow you to do this without providing direct access to the router's internal `history` instance.
