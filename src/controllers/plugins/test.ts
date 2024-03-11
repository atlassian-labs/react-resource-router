import { createMemoryHistory } from 'history';

import { invokePluginLoad } from './index';

describe('invokePluginLoad', () => {
  it('calls each plugin load method', () => {
    // (findRouterContext as any).mockReturnValue(firstContextMock);
    const pluginOne = {
      id: '1',
      routeLoad: jest.fn(),
    };
    const pluginTwo = {
      id: '2',
      routeLoad: jest.fn(),
    };

    const pluginThree = {
      id: '3',
      routeLoad: jest.fn(),
    };

    invokePluginLoad([pluginOne, pluginTwo, pluginThree], {
      history: createMemoryHistory(),
      routes: [],
    });

    expect(pluginOne.routeLoad).toHaveBeenCalled();
    expect(pluginTwo.routeLoad).toHaveBeenCalled();
    expect(pluginThree.routeLoad).toHaveBeenCalled();
  });
});
