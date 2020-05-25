import React from 'react';

import { shallow } from 'enzyme';

import { RouterSubscriber } from '../../../../../controllers/router-store';
import { RouterSubscriber as MainRouterSubscriber } from '../../../../../controllers/subscribers/route';

jest.mock('../../../../../controllers/router-store');

test('Route Subscriber should call listen if container is not inited', () => {
  const mockState = { unlisten: null };
  const mockActions = { listen: jest.fn() };

  (RouterSubscriber as any).mockImplementation(
    ({ children }: { children: any }) => children(mockState, mockActions)
  );

  const wrapper = shallow(
    <MainRouterSubscriber>{() => <div />}</MainRouterSubscriber>
  );

  wrapper.prop('children')(mockState, mockActions);
  expect(mockActions.listen).toHaveBeenCalled();
});

test('Route Subscriber should not call listen if container is inited', () => {
  const mockState = { unlisten: () => null };
  const mockActions = { listen: jest.fn() };

  (RouterSubscriber as any).mockImplementation(
    ({ children }: { children: any }) => children(mockState, mockActions)
  );

  const wrapper = shallow(
    <MainRouterSubscriber>{() => <div />}</MainRouterSubscriber>
  );

  wrapper.prop('children')(mockState, mockActions);
  expect(mockActions.listen).not.toHaveBeenCalled();
});

test('Route Subscriber should not call listen if container is static', () => {
  const mockState = { unlisten: () => null, isStatic: true };
  const mockActions = { listen: jest.fn() };

  (RouterSubscriber as any).mockImplementation(
    ({ children }: { children: any }) => children(mockState, mockActions)
  );

  const wrapper = shallow(
    <MainRouterSubscriber>{() => <div />}</MainRouterSubscriber>
  );

  wrapper.prop('children')(mockState, mockActions);
  expect(mockActions.listen).not.toHaveBeenCalled();
});
