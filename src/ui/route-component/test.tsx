import { render, screen } from '@testing-library/react';
import React from 'react';
import '@testing-library/jest-dom';

import { Router } from '../../controllers';

import { RouteComponent } from './index';

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
  it('renders the route component', () => {
    render(
      // @ts-expect-error
      <Router history={HistoryMock} routes={routes}>
        <RouteComponent />
      </Router>
    );

    // Check if the mock component is rendered
    const component = screen.getByText('My component');
    expect(component).toBeInTheDocument();

    // Optionally, check for location properties if they are passed as props
    // This might require adjusting your MockComponent to display or use these props
  });
});
