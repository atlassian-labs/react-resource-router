import { createLegacyHistory } from '../../../../../common/utils/history';

type NodeChangeCallback = () => void;

describe('createLegacyHistory', () => {
  let onNodeChanges: NodeChangeCallback = () => {};

  const triggerLocationChange = async (
    location: string,
    push: boolean = true,
  ) => {
    if (push) {
      window.history.pushState({}, '', location);
    } else {
      window.history.replaceState({}, '', location);
    }
    await new Promise(r => setTimeout(r, 60));
    onNodeChanges();
    await new Promise(r => setTimeout(r, 60));
  };

  const triggerBack = async () => {
    window.history.go(-1);

    await new Promise(r => setTimeout(r, 60));
    onNodeChanges();
    await new Promise(r => setTimeout(r, 60));
  };

  const triggerFront = async () => {
    window.history.go(1);

    await new Promise(r => setTimeout(r, 60));
    onNodeChanges();
    await new Promise(r => setTimeout(r, 60));
  };

  beforeEach(() => {
    document.querySelector = jest.fn().mockReturnValue({});
    onNodeChanges = () => {};

    (window.MutationObserver as any) = jest.fn(cb => ({
      observe: () => {
        onNodeChanges = cb as NodeChangeCallback;
      },
    }));
  });

  it('should return a valid history object', () => {
    const history = createLegacyHistory();
    expect(history).toEqual({
      location: expect.objectContaining({
        hash: expect.any(String),
        pathname: expect.any(String),
        search: expect.any(String),
      }),
      length: 1,
      push: expect.any(Function),
      replace: expect.any(Function),
      goBack: expect.any(Function),
      goForward: expect.any(Function),
      listen: expect.any(Function),
      block: expect.any(Function),
      createHref: expect.any(Function),
    });
  });

  it('should observe changes in legacy div #content', () => {
    createLegacyHistory();
    expect(document.querySelector).toHaveBeenCalledWith('#content');
    expect(window.MutationObserver).toHaveBeenCalledTimes(1);
    expect(onNodeChanges).toEqual(expect.any(Function));
  });

  it('should fail silently if legacy div #content is not found', () => {
    (document.querySelector as any).mockReturnValue(null);
    createLegacyHistory();
    expect(window.MutationObserver).toHaveBeenCalledTimes(0);
  });

  describe('location', () => {
    it('should return current location if detected on node changes', async () => {
      const history = createLegacyHistory();
      await triggerLocationChange('/bla?param=1');
      expect(history.location).toEqual({
        hash: '',
        pathname: '/bla',
        search: '?param=1',
      });
    });
  });

  describe('push()', () => {
    let spy: jest.SpyInstance;
    let holdWindowLocation: Location;

    beforeEach(() => {
      holdWindowLocation = window.location;
      const { assign, ...rest } = window.location;
      delete window.location;

      Object.defineProperty(window, 'location', {
        configurable: true,
        value: rest,
      });
      Object.defineProperty(window.location, 'assign', {
        configurable: true,
        value: jest.fn(),
      });

      spy = jest.spyOn(window.location, 'assign');
    });

    afterEach(() => {
      // ensure no mocks leak to other tests
      delete window.location;
      window.location = holdWindowLocation;
    });

    it('should change location via page reload', async () => {
      const history = createLegacyHistory();
      history.push('/foo');

      expect(spy).toHaveBeenCalledWith('/foo');
    });
  });

  describe('replace()', () => {
    it('should replace location via history', () => {
      window.history.replaceState = jest.fn();
      const history = createLegacyHistory();
      history.replace('/baz');
      expect(window.history.replaceState).toHaveBeenCalledWith({}, '', '/baz');
    });
  });

  describe('goBack()', () => {
    it('should go back in history via history', () => {
      const history = createLegacyHistory();
      window.history.back = jest.fn();
      history.goBack();
      expect(window.history.back).toHaveBeenCalled();
    });
  });

  describe('goForward()', () => {
    it('should go forward in history via history', () => {
      const history = createLegacyHistory();
      window.history.forward = jest.fn();
      history.goForward();
      expect(window.history.forward).toHaveBeenCalled();
    });
  });

  describe('listen()', () => {
    it('should notify listeners on location change for push', async () => {
      const history = createLegacyHistory();
      const listener = jest.fn();
      history.listen(listener);
      await triggerLocationChange('/home?param=2');

      expect(listener).toHaveBeenCalledWith(
        {
          hash: '',
          pathname: '/home',
          search: '?param=2',
        },
        'PUSH',
      );

      await triggerLocationChange('/home?param=2&obj=3', false);

      expect(listener).toHaveBeenCalledWith(
        {
          hash: '',
          pathname: '/home',
          search: '?param=2',
        },
        'PUSH',
      );
    });

    it('should notify the listeners of POP action for back', async () => {
      const history = createLegacyHistory();
      const listener = jest.fn();
      history.listen(listener);
      await triggerLocationChange('/home?param=2');

      await triggerLocationChange('/home?param=3');

      await triggerBack();

      expect(listener).toHaveBeenLastCalledWith(
        {
          pathname: '/home',
          hash: '',
          search: '?param=2',
        },
        'POP',
      );
    });

    it('should notify the listeners of POP action for front', async () => {
      const history = createLegacyHistory();
      const listener = jest.fn();
      history.listen(listener);
      await triggerLocationChange('/home?param=2');

      await triggerLocationChange('/home?param=3');

      await triggerBack();

      await triggerFront();

      expect(listener).toHaveBeenLastCalledWith(
        {
          pathname: '/home',
          hash: '',
          search: '?param=3',
        },
        'POP',
      );
    });

    it('should return unsubscribe listener', async () => {
      const history = createLegacyHistory();
      const listener = jest.fn();
      const unsubscribe = history.listen(listener);
      await triggerLocationChange('/foo1');
      unsubscribe();
      await triggerLocationChange('/foo2');
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });
});
