import {
  ResourceStoreData,
  RouteResourceResponse,
} from '../../../../common/types';

export const transformData = (
  data: ResourceStoreData,
  transformer: (slice: RouteResourceResponse) => RouteResourceResponse,
) =>
  Object.keys(data).reduce((acc: ResourceStoreData, type: string) => {
    if (!acc[type]) {
      acc[type] = {};
    }

    Object.keys(data[type]).forEach(key => {
      const slice = data[type][key];

      acc[type][key] = transformer(slice);
    });

    return acc;
  }, {});
