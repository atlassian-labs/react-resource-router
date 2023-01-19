import { mount } from 'enzyme';
import React from 'react';

import { useRouter } from './index';

describe('useRouter()', () => {
  it('should return the public router state and actions', () => {
    let state = { location: {} };
    let actions;

    function App() {
      const router = useRouter();

      state = router[0];
      actions = router[1];

      return null;
    }

    mount(<App />);

    expect(state.location).toMatchInlineSnapshot(`
      Object {
        "hash": "",
        "pathname": "/",
        "search": "",
      }
    `);

    expect(actions).toMatchInlineSnapshot(`
      Object {
        "bootstrapStore": [Function],
        "bootstrapStoreUniversal": [Function],
        "getBasePath": [Function],
        "getContext": [Function],
        "goBack": [Function],
        "goForward": [Function],
        "listen": [Function],
        "prefetchNextRouteResources": [Function],
        "push": [Function],
        "pushTo": [Function],
        "registerBlock": [Function],
        "replace": [Function],
        "replaceTo": [Function],
        "requestRouteResources": [Function],
        "updatePathParam": [Function],
        "updateQueryParam": [Function],
      }
    `);
  });
});
