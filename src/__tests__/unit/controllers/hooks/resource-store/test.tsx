/* eslint-disable prefer-destructuring */
import React from 'react';

import { mount } from 'enzyme';
import { act } from 'react-dom/test-utils';
import { defaultRegistry } from 'react-sweet-state';

import { DEFAULT_MATCH, DEFAULT_ROUTE } from '../../../../../common/constants';
import { useResource } from '../../../../../controllers/hooks/resource-store';
import { ResourceStore } from '../../../../../controllers/resource-store';
import { createResource } from '../../../../../controllers/resource-utils';
import { getRouterState } from '../../../../../controllers/router-store';
import { createRouterContext } from '../../../../../common/utils';
import { getDefaultStateSlice } from '../../../../../controllers/resource-store/utils';

jest.mock('../../../../../controllers/router-store', () => ({
  ...jest.requireActual<any>('../../../../../controllers/router-store'),
  getRouterState: jest.fn(),
}));

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
  expiresAt: 0,
};
const mockRoute = {
  name: '',
  path: ':page?',
  component: () => null,
};
const mockMatch = {
  params: {},
  query: {},
  isExact: false,
  path: ':page?',
  url: '',
};
const mockHydratableState = {
  resourceContext: {
    route: mockRoute,
    match: mockMatch,
    query: {},
  },
  resourceData: {
    [mockType]: {
      [mockKey]: mockSlice,
    },
  },
};

const MockComponent = ({ children, ...rest }: any) => {
  return children(rest);
};

const mockRouterContext = {
  route: DEFAULT_ROUTE,
  match: DEFAULT_MATCH,
  query: {},
};

describe('useResource hook', () => {
  let resourceStore;
  let storeState: any;
  let actions: any;
  const spy = jest.fn();

  beforeEach(() => {
    // @ts-ignore
    resourceStore = defaultRegistry.getStore(ResourceStore);
    storeState = resourceStore.storeState;
    actions = resourceStore.actions;

    (getRouterState as any).mockReturnValue(mockRouterContext);

    actions.hydrate(mockHydratableState);
    jest.spyOn(global.Date, 'now').mockReturnValue(0);
  });

  afterEach(() => {
    defaultRegistry.stores.clear();
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  it('should return the slice and bound actions for a given resource', () => {
    mount(
      <MockComponent>
        {() => {
          const resource = useResource(mockResource);

          spy(resource);

          return null;
        }}
      </MockComponent>
    );

    expect(spy).toHaveBeenCalledWith({
      ...mockSlice,
      update: expect.any(Function),
      refresh: expect.any(Function),
    });
  });

  describe('update action', () => {
    it('should update a resource with the provided data', () => {
      const newData = 'my-better-data';
      let resourceResponse: any;
      mount(
        <MockComponent>
          {() => {
            const resource = useResource(mockResource);
            resourceResponse = resource;

            return null;
          }}
        </MockComponent>
      );

      act(() => resourceResponse.update(() => newData));

      const storeData = storeState.getState();

      expect(storeData.data[mockType][mockKey]).toEqual({
        ...mockSlice,
        expiresAt: 100,
        data: newData,
        accessedAt: 0,
      });
    });

    it.each([null, undefined])(
      'should delete a resource when updated to %s',
      newData => {
        let resourceResponse: any;
        const wrapper = mount(
          <MockComponent>
            {() => {
              const resource = useResource(mockResource);
              resourceResponse = resource;

              return null;
            }}
          </MockComponent>
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
        <MockComponent>
          {() => {
            const resource = useResource(mockResource);
            resourceResponse = resource;

            return null;
          }}
        </MockComponent>
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
      let resourceResponse: any;
      mount(
        <MockComponent>
          {() => {
            const resource = useResource(mockResource);
            resourceResponse = resource;

            return null;
          }}
        </MockComponent>
      );

      act(() => resourceResponse.refresh());

      expect(getResourceSpy).toHaveBeenCalledWith(
        mockResource,
        mockRouterContext,
        { prefetch: false }
      );
    });
  });

  describe('options: custom router context', () => {
    it('should retrieve data of a custom resource state', () => {
      const mockRes = createResource({
        type: mockType,
        getKey: ({ match: { params } }) => params.page || '',
        getData: () => Promise.resolve('original-data'),
      });
      let resourceResponse: any;
      const wrapper = mount(
        <MockComponent page="page1">
          {({ page }: { page: string }) => {
            const resource = useResource(mockRes, {
              routerContext: createRouterContext(mockRoute, {
                params: { page },
              }),
            });
            resourceResponse = resource;

            return null;
          }}
        </MockComponent>
      );

      act(() => resourceResponse.update(() => 'new-data'));

      expect(storeState.getState().data[mockType]['page1']).toMatchObject({
        data: 'new-data',
      });

      // should retrieve data also on router context change
      wrapper.setProps({ page: 'page2' });
      act(() => resourceResponse.update(() => 'new-data-2'));

      expect(storeState.getState().data[mockType]['page2']).toMatchObject({
        data: 'new-data-2',
      });
    });
  });
});
