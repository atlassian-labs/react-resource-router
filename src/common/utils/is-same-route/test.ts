import { isSameRouteMatch } from './index';

describe('isSameRoute', () => {
  it('should be true', () => {
    const prevContextMatch = {
      params: {},
      isExact: false,
      path: 'jira.com',
      url: '',
      query: {},
    };

    const nextContextMatch = {
      params: {},
      isExact: false,
      path: 'jira.com',
      url: '',
      query: {},
    };
    expect(
      isSameRouteMatch({ prevContextMatch, nextContextMatch })
    ).toBeTruthy();
  });

  it('should be false, as "query" is different', () => {
    const prevContextMatch = {
      params: {},
      isExact: false,
      path: '',
      url: '',
      query: {},
    };

    const nextContextMatch = {
      params: {},
      isExact: false,
      path: '',
      url: '',
      query: {
        a: '1',
      },
    };
    expect(
      isSameRouteMatch({ prevContextMatch, nextContextMatch })
    ).toBeFalsy();
  });

  it('should be false, as "params" are different', () => {
    const prevContextMatch = {
      params: {},
      isExact: false,
      path: '',
      url: '',
      query: {},
    };

    const nextContextMatch = {
      params: {
        a: '1',
      },
      isExact: false,
      path: '',
      url: '',
      query: {},
    };
    expect(
      isSameRouteMatch({ prevContextMatch, nextContextMatch })
    ).toBeFalsy();
  });

  it('should be false, as "path" is different', () => {
    const prevContextMatch = {
      params: {},
      isExact: false,
      path: 'jira.com',
      url: '',
      query: {},
    };

    const nextContextMatch = {
      params: {},
      isExact: false,
      path: 'jira.com/issues',
      url: '',
      query: {},
    };
    expect(
      isSameRouteMatch({ prevContextMatch, nextContextMatch })
    ).toBeFalsy();
  });

  it('should return true, even though "query" props are in different order', () => {
    const prevContextMatch = {
      params: {},
      isExact: false,
      path: '',
      url: '',
      query: {
        a: '1',
        b: '2',
      },
    };

    const nextContextMatch = {
      params: {},
      isExact: false,
      path: '',
      url: '',
      query: {
        b: '2',
        a: '1',
      },
    };
    expect(
      isSameRouteMatch({ prevContextMatch, nextContextMatch })
    ).toBeTruthy();
  });

  it('should return true, even though "params" props are in different order', () => {
    const prevContextMatch = {
      params: {
        a: '1',
        b: '2',
      },
      isExact: false,
      path: '',
      url: '',
      query: {},
    };

    const nextContextMatch = {
      params: {
        b: '2',
        a: '1',
      },
      isExact: false,
      path: '',
      url: '',
      query: {},
    };
    expect(
      isSameRouteMatch({ prevContextMatch, nextContextMatch })
    ).toBeTruthy();
  });
});
