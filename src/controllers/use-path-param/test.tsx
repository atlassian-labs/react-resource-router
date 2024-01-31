import { render, act } from '@testing-library/react';
import * as historyHelper from 'history';
import React from 'react';
import { defaultRegistry } from 'react-sweet-state';

import { Router } from '../router';
import { getRouterStore } from '../router-store';

import { usePathParam } from './index';

jest.mock('../../common/utils/is-server-environment');

const mockLocation = {
  pathname: '/projects/123/board/456',
  search: '?foo=hello&bar=world',
  hash: '#hash',
};

const mockRoutes = [
  {
    path: '/projects/:projectId/board/:boardId',
    component: () => <div>path</div>,
    name: '',
  },
  {
    path: '/blah',
    component: () => <div>path</div>,
    name: '',
  },
];

const historyBuildOptions = {
  initialEntries: [
    `${mockLocation.pathname}${mockLocation.search}${mockLocation.hash}`,
  ],
};

let history = historyHelper.createMemoryHistory(historyBuildOptions);
let historyPushSpy = jest.spyOn(history, 'push');
let historyReplaceSpy = jest.spyOn(history, 'replace');

const MockComponent = ({ children, ...rest }: any) => {
  return children(rest);
};

describe('usePathParam()', () => {
  beforeEach(() => {
    history = historyHelper.createMemoryHistory(historyBuildOptions);
    historyPushSpy = jest.spyOn(history, 'push');
    historyReplaceSpy = jest.spyOn(history, 'replace');
  });

  afterEach(() => {
    defaultRegistry.stores.clear();
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  it('should return the right param value', () => {
    let ppVal: string | undefined;

    render(
      <Router history={history} routes={mockRoutes} plugins={[]}>
        <MockComponent>
          {() => {
            const [param] = usePathParam('projectId');
            ppVal = param;

            return null;
          }}
        </MockComponent>
      </Router>
    );
    expect(ppVal).toEqual('123');
  });

  it('should return undefined for non-existent params', () => {
    let ppVal: string | undefined;
    render(
      <Router history={history} routes={mockRoutes} plugins={[]}>
        <MockComponent>
          {() => {
            const [param] = usePathParam('iamnotapathparam');
            ppVal = param;

            return null;
          }}
        </MockComponent>
      </Router>
    );
    expect(ppVal).toEqual(undefined);
  });

  it('should update URL with new param value', async () => {
    let ppVal: string | undefined;
    let ppUpdateFn: (
      qp: string | undefined,
      updateType?: 'push' | 'replace'
    ) => void;

    render(
      <Router history={history} routes={mockRoutes} plugins={[]}>
        <MockComponent>
          {() => {
            const [param, setParam] = usePathParam('projectId');
            ppVal = param;
            ppUpdateFn = setParam;

            return null;
          }}
        </MockComponent>
      </Router>
    );

    expect(ppVal).toEqual('123');

    act(() => ppUpdateFn('newVal', 'push'));

    const { storeState } = getRouterStore();
    const expectedPath = `/projects/newVal/board/456${mockLocation.search}${mockLocation.hash}`;
    expect(historyReplaceSpy).not.toBeCalled();
    expect(historyPushSpy).toBeCalledWith(expectedPath);
    expect(storeState.getState().location.pathname).toEqual(
      '/projects/newVal/board/456'
    );
  });

  it('should not update the URL if the setter is called with the same param value', async () => {
    let ppVal: string | undefined;
    let ppUpdateFn: (qp: string | undefined) => void;
    let renderCount = 0;

    render(
      <Router history={history} routes={mockRoutes} plugins={[]}>
        <MockComponent>
          {() => {
            const [param, setParam] = usePathParam('projectId');
            ppVal = param;
            ppUpdateFn = setParam;
            renderCount++;

            return null;
          }}
        </MockComponent>
      </Router>
    );

    expect(ppVal).toEqual('123');

    act(() => ppUpdateFn('newVal'));
    act(() => ppUpdateFn('newVal'));

    const { storeState } = getRouterStore();
    const expectedPath = `/projects/newVal/board/456${mockLocation.search}${mockLocation.hash}`;

    expect(historyPushSpy).toBeCalledTimes(1);
    expect(historyPushSpy).toBeCalledWith(expectedPath);
    expect(storeState.getState().location.pathname).toEqual(
      '/projects/newVal/board/456'
    );
    expect(renderCount).toEqual(2);
  });

  it('should replace URL with new param value', async () => {
    let ppVal: string | undefined;
    let ppUpdateFn: (
      qp: string | undefined,
      updateType?: 'push' | 'replace'
    ) => void;

    render(
      <Router history={history} routes={mockRoutes} plugins={[]}>
        <MockComponent>
          {() => {
            [ppVal, ppUpdateFn] = usePathParam('projectId');

            return null;
          }}
        </MockComponent>
      </Router>
    );

    expect(ppVal).toEqual('123');

    act(() => ppUpdateFn('newVal', 'replace'));

    const { storeState } = getRouterStore();
    const expectedPath = `/projects/newVal/board/456${mockLocation.search}${mockLocation.hash}`;
    expect(historyPushSpy).not.toBeCalled();
    expect(historyReplaceSpy).toBeCalledWith(expectedPath);
    expect(storeState.getState().location.pathname).toEqual(
      '/projects/newVal/board/456'
    );
  });

  it('should remove :optional? param from URL when updated with undefined', async () => {
    let ppVal: string | undefined;
    let ppUpdateFn: (qp: string | undefined) => void;

    const mockRouteWithOptionalParam = {
      path: '/projects/:projectId/board/:boardId/:issueId?',
      component: () => <div>path</div>,
      name: '',
    };
    render(
      <Router
        history={history}
        routes={[mockRouteWithOptionalParam]}
        plugins={[]}
      >
        <MockComponent>
          {() => {
            const [param, setParam] = usePathParam('issueId');
            ppVal = param;
            ppUpdateFn = setParam;

            return null;
          }}
        </MockComponent>
      </Router>
    );

    expect(ppVal).toEqual(undefined);

    act(() => ppUpdateFn('newVal'));

    expect(ppVal).toEqual('newVal');
    const { storeState } = getRouterStore();
    let expectedPath = `/projects/123/board/456/newVal${mockLocation.search}${mockLocation.hash}`;
    expect(historyPushSpy).toBeCalledWith(expectedPath);
    expect(storeState.getState().location.pathname).toEqual(
      '/projects/123/board/456/newVal'
    );

    act(() => ppUpdateFn(undefined));

    expect(ppVal).toEqual(undefined);
    expectedPath = `/projects/123/board/456${mockLocation.search}${mockLocation.hash}`;
    expect(historyPushSpy).toBeCalledWith(expectedPath);
    expect(storeState.getState().location.pathname).toEqual(
      '/projects/123/board/456'
    );
  });

  it('should throw when non-optional params are set undefined', async () => {
    let ppVal: string | undefined;
    let ppUpdateFn: (qp: string | undefined) => void;

    const mockRouteWithOptionalParam = {
      path: '/projects/:projectId/board/:boardId/:issueId?',
      component: () => <div>path</div>,
      name: '',
    };
    render(
      <Router
        history={history}
        routes={[mockRouteWithOptionalParam]}
        plugins={[]}
      >
        <MockComponent>
          {() => {
            const [param, setParam] = usePathParam('boardId');
            ppVal = param;
            ppUpdateFn = setParam;

            return null;
          }}
        </MockComponent>
      </Router>
    );

    expect(ppVal).toEqual('456');

    act(() => ppUpdateFn('newVal'));

    expect(ppVal).toEqual('newVal');
    const { storeState } = getRouterStore();
    const expectedPath = `/projects/123/board/newVal${mockLocation.search}${mockLocation.hash}`;
    expect(historyPushSpy).toBeCalledWith(expectedPath);
    expect(storeState.getState().location.pathname).toEqual(
      '/projects/123/board/newVal'
    );
    expect(() => ppUpdateFn(undefined)).toThrow();
  });
});
