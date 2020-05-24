import React from 'react';

import { mount } from 'enzyme';

import { NOOP_HISTORY } from '../../../../common/constants';
import { Router } from '../../../../controllers/router';
import { noopRouterDecorator } from '../../../../ui/noop-router-decorator';

const MyStory = () => <div>contents</div>;
const getMounted = () => mount(noopRouterDecorator(MyStory));

describe('Noop router decorator', () => {
  test('it should wrap the story with a RouterContainer', () => {
    const linkProviderEl = getMounted().find(Router);

    expect(linkProviderEl).not.toBeNull();
  });

  test('the RouterContainer contains a noop history and empty routes', () => {
    const linkProviderEl = getMounted().find(Router);

    expect(linkProviderEl.props()).toEqual(
      expect.objectContaining({
        history: expect.objectContaining(NOOP_HISTORY),
        routes: expect.any(Array),
      }),
    );
  });
});
