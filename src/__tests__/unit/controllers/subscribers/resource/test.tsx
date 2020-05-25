/* eslint-disable prefer-destructuring */
import React from 'react';

import { mount } from 'enzyme';
import { act } from 'react-dom/test-utils';
import { defaultRegistry } from 'react-sweet-state';

import {
  DEFAULT_HISTORY,
  DEFAULT_MATCH,
  DEFAULT_ROUTE,
} from '../../../../../common/constants';
import { ResourceStore } from '../../../../../controllers/resource-store';
import { createResource } from '../../../../../controllers/resource-utils';
import { ResourceSubscriber } from '../../../../../controllers/subscribers/resource';

describe('ResourceSubscriber', () => {
  const type = 'type';
  const key = 'key';
  const result = 'result';
  const getDataPromise = Promise.resolve(result);
  const mockResource = createResource({
    type,
    getKey: () => key,
    getData: () => getDataPromise,
    maxAge: 100,
  });
  const mockSlice = {
    data: null,
    error: null,
    loading: false,
    promise: Promise.resolve(),
    expiresAt: 100,
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
        [type]: {
          [key]: {
            data: result,
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
        [type]: {
          [key]: {
            data: result,
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
          [type]: {
            [key]: mockSlice,
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

      expect(storeData.data[type][key]).toEqual({
        ...mockSlice,
        data: newData,
      });
    });

    it('should update a resource with the data set to null', () => {
      const newData = null;
      let subscriberUpdate: any;
      storeState.setState({
        data: {
          [type]: {
            [key]: mockSlice,
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

      expect(storeData.data[type][key]).toEqual({
        ...mockSlice,
        data: newData,
      });
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
        location: DEFAULT_HISTORY.location,
      };

      expect(getResourceSpy).toHaveBeenCalledWith(
        mockResource,
        expectedRouterStoreContext
      );
    });
  });
});
