#### Code splitting with `getDataLoader`

Code that is used to retrieve data can be asynchronously imported using the `getDataLoader` resource
property. This can be handy if your data fetching functions have a lot of dependencies meaning that they would bloat your main bundle size if imported synchronously.

The module that is imported through `getDataLoader` must export a default property that is the
function we use to load data.

**NOTE!** you cannot have both `getData` and `getDataLoader` on the same resource.
