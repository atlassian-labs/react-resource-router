import { mount } from 'enzyme';
import React from 'react';

import { useRouterActions } from './index';

describe('useRouterActions()', () => {
  it('should return the public router actions', () => {
    let routerActions;

    function App() {
      routerActions = useRouterActions();

      return null;
    }

    mount(<App />);

    expect(routerActions).toMatchInlineSnapshot(`
      Object {
        "bootstrapStore": [Function],
        "getBasePath": [Function],
        "getContext": [Function],
        "goBack": [Function],
        "goForward": [Function],
        "listen": [Function],
        "loadRoute": [Function],
        "prefetchRoute": [Function],
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
