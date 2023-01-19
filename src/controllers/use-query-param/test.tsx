import { mount } from 'enzyme';
import * as historyHelper from 'history';
import React from 'react';
import { act } from 'react-dom/test-utils';
import { defaultRegistry } from 'react-sweet-state';

import { Router } from '../../controllers';
import { getRouterStore } from '../../controllers/router-store';

import { useQueryParam } from './index';

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
const nextTick = () => new Promise(resolve => setTimeout(resolve));

const MockComponent = ({ children, ...rest }: any) => {
  return children(rest);
};

describe('useQueryParam()', () => {
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
    mount(
      <Router routes={mockRoutes} history={history}>
        <MockComponent>
          {() => {
            const [param] = useQueryParam('foo');
            expect(param).toEqual('hello');

            return null;
          }}
        </MockComponent>
      </Router>
    );
  });

  it('should return undefined for non-existent params', () => {
    mount(
      <Router routes={mockRoutes} history={history}>
        <MockComponent>
          {() => {
            const [param] = useQueryParam('iamnotaqueryparam');
            expect(param).toEqual(undefined);

            return null;
          }}
        </MockComponent>
      </Router>
    );
  });

  it('should return undefined for non-existent params and update the URL when set for the first time', async () => {
    const mockPath = mockLocation.pathname;
    let qpVal: string | undefined;
    let qpUpdateFn: (qp: string) => void;

    mount(
      <Router routes={mockRoutes} history={history}>
        <MockComponent>
          {() => {
            const [param, setParam] = useQueryParam('newqueryparam');
            qpVal = param;
            qpUpdateFn = setParam;

            return null;
          }}
        </MockComponent>
      </Router>
    );
    expect(qpVal).toEqual(undefined);
    act(() => qpUpdateFn('val'));
    await nextTick();

    expect(historyPushSpy).toBeCalledWith(
      `${mockPath}?foo=hello&bar=world&newqueryparam=val#hash`
    );
  });

  it('should update URL with new param value', async () => {
    const mockPath = mockLocation.pathname;
    let qpVal: string | undefined;
    let qpUpdateFn: (qp: string, updateType?: 'push' | 'replace') => void;

    mount(
      <Router routes={mockRoutes} history={history}>
        <MockComponent>
          {() => {
            const [param, setParam] = useQueryParam('foo');
            qpVal = param;
            qpUpdateFn = setParam;

            return null;
          }}
        </MockComponent>
      </Router>
    );

    expect(qpVal).toEqual('hello');
    act(() => qpUpdateFn('newVal', 'push'));
    await nextTick();

    expect(historyReplaceSpy).not.toBeCalled();
    expect(historyPushSpy).toBeCalledWith(
      `${mockPath}?foo=newVal&bar=world#hash`
    );
  });

  it('should not rerender if the setter is called with the same param value', async () => {
    const mockPath = mockLocation.pathname;
    let qpVal: string | undefined;
    let qpUpdateFn: (qp: string) => void;
    let renderCount = 0;

    mount(
      <Router routes={mockRoutes} history={history}>
        <MockComponent>
          {() => {
            const [param, setParam] = useQueryParam('foo');
            qpVal = param;
            qpUpdateFn = setParam;
            renderCount++;

            return null;
          }}
        </MockComponent>
      </Router>
    );

    expect(qpVal).toEqual('hello');
    act(() => qpUpdateFn('newVal'));
    act(() => qpUpdateFn('newVal'));
    await nextTick();

    expect(historyPushSpy).toBeCalledTimes(1);
    expect(historyPushSpy).toBeCalledWith(
      `${mockPath}?foo=newVal&bar=world#hash`
    );
    expect(renderCount).toEqual(2);
  });

  it('should replace the URL with new param value', async () => {
    const mockPath = mockLocation.pathname;
    let qpVal: string | undefined;
    let qpUpdateFn: (qp: string, updateType?: 'push' | 'replace') => void;

    mount(
      <Router routes={mockRoutes} history={history}>
        <MockComponent>
          {() => {
            [qpVal, qpUpdateFn] = useQueryParam('foo');

            return null;
          }}
        </MockComponent>
      </Router>
    );

    expect(qpVal).toEqual('hello');
    act(() => qpUpdateFn('newVal', 'replace'));
    await nextTick();

    expect(historyPushSpy).not.toBeCalled();
    expect(historyReplaceSpy).toBeCalledWith(
      `${mockPath}?foo=newVal&bar=world#hash`
    );
  });

  it('should remove param from URL when set to undefined', async () => {
    const mockPath = mockLocation.pathname;
    let qpVal: string | undefined;
    let qpUpdateFn: (qp: string | undefined) => void;

    mount(
      <Router routes={mockRoutes} history={history}>
        <MockComponent>
          {() => {
            const [param, setParam] = useQueryParam('foo');
            qpVal = param;
            qpUpdateFn = setParam;

            return null;
          }}
        </MockComponent>
      </Router>
    );

    expect(qpVal).toEqual('hello');

    act(() => qpUpdateFn(undefined));

    await nextTick();

    expect(qpVal).toEqual(undefined);
    expect(historyPushSpy).toBeCalledWith(`${mockPath}?bar=world#hash`);
  });

  it('should only re-render components hooked to a specific param', async () => {
    let fooVal: string | undefined;
    let barVal: string | undefined;
    let fooUpdateFn: (qp: string) => void;
    let barUpdateFn: (qp: string) => void;

    let renderedFoo = 0;
    const ComponentFoo = () => {
      const [foo, setFoo] = useQueryParam('foo');
      fooVal = foo;
      fooUpdateFn = setFoo;
      renderedFoo++;

      return null;
    };
    let renderedBar = 0;
    const ComponentBar = () => {
      const [bar, setBar] = useQueryParam('bar');
      barVal = bar;
      barUpdateFn = setBar;
      renderedBar++;

      return null;
    };

    mount(
      <Router
        routes={mockRoutes}
        history={historyHelper.createBrowserHistory()}
      >
        <ComponentFoo />
        <ComponentBar />
      </Router>
    );
    expect(renderedFoo).toEqual(1);
    expect(renderedBar).toEqual(1);

    const { storeState, actions } = getRouterStore();

    actions.push('/projects/123/board/456?foo=hello&bar=world');
    await nextTick();

    expect(fooVal).toEqual('hello');
    expect(barVal).toEqual('world');
    expect(renderedFoo).toEqual(2);
    expect(renderedBar).toEqual(2);

    act(() => fooUpdateFn('newVal'));
    await nextTick();

    // URL is now — /projects/123/board/456?foo=newVal&bar=world
    expect(storeState.getState().location.pathname).toEqual(
      '/projects/123/board/456'
    );
    expect(storeState.getState().location.search).toEqual(
      '?foo=newVal&bar=world'
    );
    expect(fooVal).toEqual('newVal');
    expect(barVal).toEqual('world');
    expect(renderedFoo).toEqual(3);
    expect(renderedBar).toEqual(2);

    act(() => barUpdateFn('newVal'));
    await nextTick();

    // URL is now — /projects/123/board/456?foo=newVal&bar=newVal
    expect(storeState.getState().location.pathname).toEqual(
      '/projects/123/board/456'
    );
    expect(storeState.getState().location.search).toEqual(
      '?foo=newVal&bar=newVal'
    );
    expect(fooVal).toEqual('newVal');
    expect(barVal).toEqual('newVal');
    expect(renderedFoo).toEqual(3);
    expect(renderedBar).toEqual(3);
  });

  it('should return the right param value when two hooks are used in the same component', async () => {
    const mockPath = mockLocation.pathname;
    let fooVal: string | undefined;
    let fooUpdateFn: (qp: string) => void;
    let barVal: string | undefined;
    let barUpdateFn: (qp: string) => void;

    mount(
      <Router routes={mockRoutes} history={history}>
        <MockComponent>
          {() => {
            const [foo, setFoo] = useQueryParam('foo');
            const [bar, setBar] = useQueryParam('bar');
            fooVal = foo;
            fooUpdateFn = setFoo;
            barVal = bar;
            barUpdateFn = setBar;

            return null;
          }}
        </MockComponent>
      </Router>
    );

    expect(fooVal).toEqual('hello');
    expect(barVal).toEqual('world');

    act(() => fooUpdateFn('newFoo'));
    await nextTick();

    expect(fooVal).toEqual('newFoo');
    expect(barVal).toEqual('world');
    expect(historyPushSpy).toBeCalledWith(
      `${mockPath}?foo=newFoo&bar=world#hash`
    );

    act(() => barUpdateFn('newBar'));
    await nextTick();

    expect(fooVal).toEqual('newFoo');
    expect(barVal).toEqual('newBar');
    expect(historyPushSpy).toBeCalledWith(
      `${mockPath}?foo=newFoo&bar=newBar#hash`
    );
  });
});
