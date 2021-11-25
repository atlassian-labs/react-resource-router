/* eslint-disable prefer-destructuring */
import React from 'react';

import { mount } from 'enzyme';
import { act } from 'react-dom/test-utils';
import { defaultRegistry } from 'react-sweet-state';

import { DEFAULT_MATCH, DEFAULT_ROUTE } from '../../../../../common/constants';
import { ResourceStore } from '../../../../../controllers/resource-store';
import { createResource } from '../../../../../controllers/resource-utils';
import { ResourceSubscriber } from '../../../../../controllers/subscribers/resource';
import { getDefaultStateSlice } from '../../../../../controllers/resource-store/utils';

describe('ResourceSubscriber', () => {
  const mockType = 'some-type';
  const mockKey = 'i-am-a-key';
  const mockData = 'my-remote-data';
  const mockResource = createResource({
    type: mockType,
    getKey: () => mockKey,
    getData: () => Promise.resolve(mockData),
    maxAge: 100,
  });
  const mockSlice = {
    data: 'my-initial-data',
    error: null,
    loading: false,
    key: mockKey,
    promise: Promise.resolve('my-initial-data'),
    expiresAt: 100,
    accessedAt: 0,
  };
  let resourceStore;
  let storeState: any;
  let actions: any;

  beforeEach(() => {
    // @ts-ignore
    resourceStore = defaultRegistry.getStore(ResourceStore);
    storeState = resourceStore.storeState;
    actions = resourceStore.actions;

    jest.spyOn(global.Date, 'now').mockReturnValue(0);
  });
  afterEach(() => {
    defaultRegistry.stores.clear();
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  it('should render a loading component if using a resource that has not yet been resolved', () => {
    storeState.setState({
      data: {
        [mockType]: {
          [mockKey]: {
            data: mockData,
            loading: true,
            error: null,
            promise: null,
          },
        },
      },
    });

    const Component = () => (
      <ResourceSubscriber resource={mockResource}>
        {({ data, loading }) => {
          if (loading) {
            return <div id="loading" />;
          }

          if (data) {
            return <div id="data" />;
          }

          return null;
        }}
      </ResourceSubscriber>
    );
    const wrapper = mount(<Component />);

    expect(wrapper.find('#loading')).toHaveLength(1);
    expect(wrapper.find('#data')).toHaveLength(0);
  });

  it('should get the slice of data for the type and key', async () => {
    storeState.setState({
      data: {
        [mockType]: {
          [mockKey]: {
            data: mockData,
            loading: false,
            error: null,
            promise: null,
          },
        },
      },
    });

    const Component = () => (
      <ResourceSubscriber resource={mockResource}>
        {({ data, loading }) => {
          if (loading) {
            return <div id="loading" />;
          }

          if (data) {
            return <div id="data" />;
          }

          return null;
        }}
      </ResourceSubscriber>
    );
    const wrapper = mount(<Component />);

    expect(wrapper.find('#loading')).toHaveLength(0);
    expect(wrapper.find('#data')).toHaveLength(1);
  });

  describe('update action', () => {
    it('should update a resource with the provided data', () => {
      const newData = 'my-better-data';
      let subscriberUpdate: any;
      storeState.setState({
        data: {
          [mockType]: {
            [mockKey]: mockSlice,
          },
        },
      });
      mount(
        <ResourceSubscriber resource={mockResource}>
          {({ data, loading, update }) => {
            subscriberUpdate = update;

            if (loading) {
              return <div id="loading" />;
            }

            if (data) {
              return <div id="data" />;
            }

            return null;
          }}
        </ResourceSubscriber>
      );

      act(() => subscriberUpdate(() => newData));

      const storeData = storeState.getState();

      expect(storeData.data[mockType][mockKey]).toEqual({
        ...mockSlice,
        data: newData,
      });
    });

    it.each([null, undefined])(
      'should delete a resource when updated to %s',
      async newData => {
        let resourceResponse: any;
        storeState.setState({
          data: {
            [mockType]: {
              [mockKey]: mockSlice,
            },
          },
        });
        const wrapper = mount(
          <ResourceSubscriber resource={mockResource}>
            {resource => {
              resourceResponse = resource;

              return null;
            }}
          </ResourceSubscriber>
        );

        act(() => resourceResponse.update(() => newData));

        const storeData = storeState.getState();
        expect(storeData.data[mockType][mockKey]).toEqual(undefined);

        wrapper.update();
        expect(resourceResponse).toEqual({
          ...getDefaultStateSlice(),
          key: mockKey,
          refresh: expect.any(Function),
          update: expect.any(Function),
        });
      }
    );

    it('should call update function with current data', () => {
      const currentData = 'my-current-data';
      const updater = jest.fn();
      let resourceResponse: any;
      mount(
        <ResourceSubscriber resource={mockResource}>
          {resource => {
            resourceResponse = resource;

            return null;
          }}
        </ResourceSubscriber>
      );

      act(() => resourceResponse.update(() => currentData));
      act(() => resourceResponse.update(updater));

      expect(updater).toHaveBeenCalledWith(currentData);
    });
  });

  describe('refresh action', () => {
    it('should call actions.getResourceFromRemote', () => {
      const getResourceSpy = jest
        .spyOn(actions, 'getResourceFromRemote')
        .mockImplementation(() => {});
      let subscriberRefresh: any;
      mount(
        <ResourceSubscriber resource={mockResource}>
          {({ data, loading, refresh }) => {
            subscriberRefresh = refresh;

            if (loading) {
              return <div id="loading" />;
            }

            if (data) {
              return <div id="data" />;
            }

            return null;
          }}
        </ResourceSubscriber>
      );

      act(() => subscriberRefresh());

      const expectedRouterStoreContext = {
        route: DEFAULT_ROUTE,
        match: DEFAULT_MATCH,
        query: {},
      };

      expect(getResourceSpy).toHaveBeenCalledWith(
        mockResource,
        expectedRouterStoreContext,
        { prefetch: false }
      );
    });
  });
});
