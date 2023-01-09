import { mount } from 'enzyme';
import React from 'react';
import { defaultRegistry } from 'react-sweet-state';

import { getRouterState } from '../router-store';
import { MemoryRouter } from './index';

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
