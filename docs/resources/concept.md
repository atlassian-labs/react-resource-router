# What are Router Resources?

Router Resources are objects that are used by the router to fetch, cache and provide data for route components.

You can create these objects using the [`createResource`](./creation.md) function and then put them in the `resources` array on your route configuration object. Doing so means that each resources' data will be fetched as soon as the Router is mounted on initial page loads and on route transitions if the resources have expired.

Since we recommend that your [`Router`](../api/components.md#router) sits as high up in your React tree as possible, it means that asynchronous requests for data are triggered as early as can be. This results in quicker meaningful render times.

When using resources, you should initialise the resources plugin with [`createResourcesPlugin`](../api/components?id=resources-plugin), and ensure that this is loaded as a plugin when calling [`Router`](../api/components.md#router) in your app.