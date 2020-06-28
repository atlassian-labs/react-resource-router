import React from 'react';

import { mount } from 'enzyme';

import { Router } from '../../../../controllers/router';
import { RouteComponent } from '../../../../ui/route-component';

const MockComponent = () => <div>My component</div>;

const MockLocation = {
  pathname: '/home',
  search: '',
  hash: '',
};

const HistoryMock = {
  push: jest.fn(),
  replace: jest.fn(),
  goBack: jest.fn(),
  goForward: jest.fn(),
  registerBlock: jest.fn(),
  listen: () => jest.fn(),
  createHref: jest.fn(),
  location: MockLocation,
  _history: jest.fn(),
};

const routes = [
  {
    component: MockComponent,
    path: '/home',
  },
];

describe('<Route />', () => {
  it('renders a the route component', () => {
    const wrapper = mount(
      // @ts-ignore
      <Router routes={routes} history={HistoryMock}>
        <RouteComponent />
      </Router>
    );

    const component = wrapper.find(MockComponent);

    expect(component).toHaveLength(1);

    expect(component.prop('location')).toEqual(MockLocation);
  });
});
