import { getResourceStore } from '../../../controllers/resource-store/index';

export const getResourcesSafeData = () => {
  return getResourceStore().actions.getSafeData();
};
