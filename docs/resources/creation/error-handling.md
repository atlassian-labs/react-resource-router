#### How to handle errors in `getData`

It is worth noting that how you handle errors in `getData` can have subtle effects.

```js
import { MyCustomError } from '../common/errors';
import { getAccountInfoData } from '../api';

// Example of a getData function that is used to retrieve account info
const getData = async (routerContext, resourceContext) => {
  const { query } = routerContext;
  // assuming isAdmin has been provided to the router as static resourceContext
  const { isAdmin } = resourceContext;

  if (!isAdmin) {
    // NOT RECOMMENDED:
    // The resource slice will take the shape: `{data: {}, error: null, loading: false}`
    // You should consider throwing an error here to ensure `data` remains `null`
    return Promise.resolve({});
  }

  const data = getAccountInfoData(isAdmin, query);

  if (!data) {
    // BETTER IMPLEMENTATION:
    // The resource state will take on the shape:  `{data: {errorCode: 'some error'}', error: null, loading: false}`
    // Only consider this pattern if your component is checking `data` for an errorCode property
    return { errorCode: 'some error' };
  }

  if (!data) {
    // RECOMMENDED IMPLEMENTATION:
    // The resource state will take the shape:  `{data: null, error: MyCustomError, loading: false}`
    throw new MyCustomError('bad thing happen');
  }

  return data;
};
```
