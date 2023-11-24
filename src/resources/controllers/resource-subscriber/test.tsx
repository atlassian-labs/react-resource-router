import { render, act, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { defaultRegistry } from 'react-sweet-state';

import { DEFAULT_MATCH, DEFAULT_ROUTE } from '../../../index';
import { createResource, ResourceStore } from '../resource-store';

import { ResourceSubscriber } from './index';

describe('<ResourceSubscriber />', () => {
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

    render(
      <ResourceSubscriber resource={mockResource}>
        {({ data, loading }) => {
          if (loading) {
            return <div data-testid="loading" />;
          }

          if (data) {
            return <div data-testid="data" />;
          }

          return null;
        }}
      </ResourceSubscriber>
    );
    expect(screen.getByTestId('loading')).toBeInTheDocument();
    expect(screen.queryByTestId('data')).not.toBeInTheDocument();
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

    render(
      <ResourceSubscriber resource={mockResource}>
        {({ data, loading }) => {
          if (loading) {
            return <div>loading</div>;
          }

          if (data) {
            return <div>data</div>;
          }

          return null;
        }}
      </ResourceSubscriber>
    );

    expect(screen.getByText('data')).toBeInTheDocument();
    expect(screen.queryByText('loading')).not.toBeInTheDocument();
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
      render(
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
      render(
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
      render(
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
