import { createResource } from '../../../index';

import { getResourceIdentifier, getResourceIdentifiers } from './index';

const getDataPromise = Promise.resolve();
const type = 'my-cool-type';
const key = 'Ky';
const mockResource = createResource({
  type,
  getKey: () => key,
  getData: () => getDataPromise,
});
const mockRoute = {
  name: '',
  path: '',
  component: () => null,
  resources: [],
};
const mockMatch = {
  params: {},
  query: {},
  isExact: false,
  path: '',
  url: '',
};
const mockRouterStoreContext = {
  route: mockRoute,
  match: mockMatch,
  query: {},
};

const mockResourceStoreContext = { foo: 'bar' };

describe('getResourceIdentifier()', () => {
  it('should return the type and key as a concatenated string', () => {
    expect(
      getResourceIdentifier(
        mockResource,
        mockRouterStoreContext,
        mockResourceStoreContext
      )
    ).toEqual(`${type}/${key}`);
  });
});

describe('getResourceIdentifiers()', () => {
  it('should create an array of resource identifiers for the provided resources', () => {
    const mockResource2 = createResource({
      type: 'mockResource2',
      getKey: () => 'mockResource2Key',
      getData: () => getDataPromise,
    });
    const mockResource3 = createResource({
      type: 'mockResource3',
      getKey: () => 'mockResource3Key',
      getData: () => getDataPromise,
    });

    expect(
      getResourceIdentifiers(
        [mockResource, mockResource2, mockResource3],
        mockRouterStoreContext,
        mockResourceStoreContext
      )
    ).toEqual([
      `${type}/${key}`,
      'mockResource2/mockResource2Key',
      'mockResource3/mockResource3Key',
    ]);
  });
});
