# How to Create Nested Routes Using Slot in React Resource Router

The React Resource Router library generally encourages you to keep your routing flat. However, there may be situations where you need nested components associated with different URLs. To accomplish this, you can create a Slot component.

Here's how to do it:

## Slot Component

```js
import { useRouter, Redirect } from 'react-resource-router';

// Define a object of URLs to Components. 
// Make sure the keys in this object match the URLs you intend to handle.
const slots = {
  'url-one': ComponentOne,
  'url-two': ComponentTwo,
};

const Slot = () => {
  const [{ route }] = useRouter();
  const name = route.name;

  // If the specified slot doesn't exist, redirect to a 404 page
  if (!slots?.[name]) {
    return <Redirect to="/404" />;
  }

  // Dynamically load and render the component based on the current route name
  const DynamicComponent = slots[name];
  return <DynamicComponent />;
};

```

## Add Slot Component to Parent

```js
const Page = () => {
  return (
    <div>
      <Slot>
    </div>
  )
}
```