import { mockRouteContext } from '../../mocks';

import { shouldReloadWhenRouteMatchChanges } from './index';

describe('shoudl-reload-when-route-match-changes', () => {
  it('return "true" when query param changes', () => {
    const context = {
      ...mockRouteContext,
      match: {
        ...mockRouteContext.match,
        query: { projectId: '1' },
      },
    };
    const prevContext = {
      ...mockRouteContext,
      match: {
        ...mockRouteContext.match,
        query: { projectId: '2' },
      },
    };

    expect(
      shouldReloadWhenRouteMatchChanges({
        query: ['projectId'],
      })({
        context,
        prevContext,
        defaultShouldReload: true,
        pluginId: 'test-plugin',
      })
    ).toBeTruthy();
  });

  it('return "false" when query param changes', () => {
    const context = {
      ...mockRouteContext,
      match: {
        ...mockRouteContext.match,
        query: { projectKey: '1' },
      },
    };
    const prevContext = {
      ...mockRouteContext,
      match: {
        ...mockRouteContext.match,
        query: { projectKey: '2' },
      },
    };

    expect(
      shouldReloadWhenRouteMatchChanges({
        query: ['projectId'],
      })({
        context,
        prevContext,
        defaultShouldReload: true,
        pluginId: 'test-plugin',
      })
    ).toBeFalsy();
  });

  it('return "true" when param changes', () => {
    const context = {
      ...mockRouteContext,
      match: {
        ...mockRouteContext.match,
        params: { projectId: '1' },
      },
    };
    const prevContext = {
      ...mockRouteContext,
      match: {
        ...mockRouteContext.match,
        params: { projectId: '2' },
      },
    };

    expect(
      shouldReloadWhenRouteMatchChanges({
        params: ['projectId'],
      })({
        context,
        prevContext,
        defaultShouldReload: true,
        pluginId: 'test-plugin',
      })
    ).toBeTruthy();
  });

  it('return "false" when param changes', () => {
    const context = {
      ...mockRouteContext,
      match: {
        ...mockRouteContext.match,
        params: { projectKey: '1' },
      },
    };
    const prevContext = {
      ...mockRouteContext,
      match: {
        ...mockRouteContext.match,
        params: { projectKey: '2' },
      },
    };

    expect(
      shouldReloadWhenRouteMatchChanges({
        query: ['projectId'],
      })({
        context,
        prevContext,
        defaultShouldReload: true,
        pluginId: 'test-plugin',
      })
    ).toBeFalsy();
  });
});
