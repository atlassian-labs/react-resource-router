import { getResourceStore } from '../../../controllers/resource-store/index';

export const getSerializedResources = () => {
  return getResourceStore().actions.getSafeData();
};
