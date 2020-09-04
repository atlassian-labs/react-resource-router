import React from 'react';

import { mount } from 'enzyme';
import * as historyHelper from 'history';
import { defaultRegistry } from 'react-sweet-state';
import { act } from 'react-dom/test-utils';

import { MemoryRouter } from '../../../../../controllers/memory-router';
import { useQueryParam } from '../../../../../controllers/hooks/router-store';

const mockLocation = {
  pathname: '/pathname',
  search: '?foo=bar&hello=world',
  hash: '#hash',
};

const mockHistory = {
  push: jest.fn(),
  replace: jest.fn(),
  goBack: jest.fn(),
  goForward: jest.fn(),
  registerBlock: jest.fn(),
  listen: jest.fn(),
  createHref: jest.fn(),
  location: mockLocation,
  block: jest.fn(),
};

const mockRoutes = [
  {
    path: '/pathname',
    component: () => <div>path</div>,
    name: '',
  },
  {
    path: '/blah',
    component: () => <div>path</div>,
    name: '',
  },
];

const nextTick = () => new Promise(resolve => setTimeout(resolve));

const MockComponent = ({ children, ...rest }: any) => {
  return children(rest);
};

describe('useQueryParam', () => {
  const { location } = window;

  beforeAll(() => {
    delete window.location;
    // @ts-ignore
    window.location = {};
    Object.defineProperties(window.location, {
      href: { value: location.href },
      assign: { value: jest.fn() },
      replace: { value: jest.fn() },
    });
  });

  beforeEach(() => {
    jest
      .spyOn(historyHelper, 'createMemoryHistory')
      // @ts-ignore
      .mockImplementation(() => mockHistory);
  });

  afterEach(() => {
    defaultRegistry.stores.clear();
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  afterAll(() => {
    window.location = location;
  });

  it('should return the right param value', () => {
    mount(
      <MemoryRouter routes={mockRoutes}>
        <MockComponent>
          {() => {
            const [param] = useQueryParam('foo');
            expect(param).toEqual('bar');

            return <div>I am a subscriber</div>;
          }}
        </MockComponent>
      </MemoryRouter>
    );
  });

  it('should return undefined for non-existent params', () => {
    mount(
      <MemoryRouter routes={mockRoutes}>
        <MockComponent>
          {() => {
            const [param] = useQueryParam('iamnotaqueryparam');
            expect(param).toEqual(undefined);

            return <div>I am a subscriber</div>;
          }}
        </MockComponent>
      </MemoryRouter>
    );
  });

  it('should update URL with new param value', async () => {
    const mockPath = mockLocation.pathname;
    let qpVal: string | undefined, qpUpdateFn: (qp: string) => void;

    mount(
      <MemoryRouter routes={mockRoutes}>
        <MockComponent>
          {() => {
            const [param, setParam] = useQueryParam('foo');
            qpVal = param;
            qpUpdateFn = setParam;

            return <div>I am a subscriber</div>;
          }}
        </MockComponent>
      </MemoryRouter>
    );

    expect(qpVal).toEqual('bar');

    act(() => qpUpdateFn('newVal'));

    await nextTick();

    expect(mockHistory.push).toBeCalledWith(
      `${mockPath}?hello=world&foo=newVal`
    );
  });

  it('should remove param from URL when set to null', async () => {
    const mockPath = mockLocation.pathname;
    let qpVal: string | undefined, qpUpdateFn: (qp: string | null) => void;

    mount(
      <MemoryRouter routes={mockRoutes}>
        <MockComponent>
          {() => {
            const [param, setParam] = useQueryParam('foo');
            qpVal = param;
            qpUpdateFn = setParam;

            return <div>I am a subscriber</div>;
          }}
        </MockComponent>
      </MemoryRouter>
    );

    expect(qpVal).toEqual('bar');

    act(() => qpUpdateFn(null));

    await nextTick();

    expect(mockHistory.push).toBeCalledWith(`${mockPath}?hello=world`);
  });
});
