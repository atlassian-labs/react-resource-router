import React from 'react';

import { mount } from 'enzyme';
import { defaultRegistry } from 'react-sweet-state';

import { MemoryRouter } from '../../../../controllers/memory-router';
import { getRouterState } from '../../../../controllers/router-store';

describe('<MemoryRouter />', () => {
  afterEach(() => {
    defaultRegistry.stores.clear();
  });

  it('should register an instance of memory history in the router store when mounted', () => {
    mount(<MemoryRouter routes={[]}>{'hello world'}</MemoryRouter>);

    const { history } = getRouterState();

    expect(history).toHaveProperty('canGo');
  });
});
