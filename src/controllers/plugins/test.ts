import { createMemoryHistory } from 'history';

import { invokePluginLoad } from './index';

describe('invokePluginLoad', () => {
  it('calls each plugin load method', () => {
    // (findRouterContext as any).mockReturnValue(firstContextMock);
    const pluginOne = {
      routeLoad: jest.fn(),
    };
    const pluginTwo = {
      routeLoad: jest.fn(),
    };

    const pluginThree = {
      routeLoad: jest.fn(),
    };

    invokePluginLoad([pluginOne, pluginTwo, pluginThree], {
      history: createMemoryHistory(),
      routes: [],
    });

    expect(pluginOne.routeLoad).toBeCalled();
    expect(pluginTwo.routeLoad).toBeCalled();
    expect(pluginThree.routeLoad).toBeCalled();
  });
});
