import { render } from '@testing-library/react';
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

    render(<App />);

    expect(state.location).toMatchInlineSnapshot(`
      {
        "hash": "",
        "pathname": "/",
        "search": "",
      }
    `);

    expect(actions).toMatchInlineSnapshot(`
      {
        "bootstrapStore": [Function],
        "getBasePath": [Function],
        "getContext": [Function],
        "goBack": [Function],
        "goForward": [Function],
        "listen": [Function],
        "loadPlugins": [Function],
        "prefetchRoute": [Function],
        "push": [Function],
        "pushTo": [Function],
        "registerBlock": [Function],
        "replace": [Function],
        "replaceTo": [Function],
        "updatePathParam": [Function],
        "updateQueryParam": [Function],
      }
    `);
  });
});
