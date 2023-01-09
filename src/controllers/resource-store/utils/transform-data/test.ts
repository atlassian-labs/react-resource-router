import { transformData } from './index';

describe('transformData()', () => {
  it('should transform the supplied data with the transformer function passed', () => {
    const staticProps = { promise: null, error: null, loading: false };
    const transformFrom = {
      data: { hello: 'world' },
      expiresAt: Infinity,
      accessedAt: 0,
    };
    const transformTo = {
      data: { goodbye: 'cruel world' },
      expiresAt: 1000,
      accessedAt: 0,
    };
    const data = {
      type: {
        key: {
          ...staticProps,
          ...transformFrom,
        },
      },
    };
    const transformed = transformData(data, slice => ({
      ...slice,
      ...transformTo,
    }));

    expect(transformed).toEqual({
      type: {
        key: {
          ...staticProps,
          ...transformTo,
        },
      },
    });
  });
});
