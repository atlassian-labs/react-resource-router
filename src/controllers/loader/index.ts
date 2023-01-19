import { ResourceStoreContext } from '../../common/types';
import { combine } from '../../common/utils/combine';
import { entryPointsLoader } from '../../entry-points/loader';
import { resourcesLoader } from '../../resources/loader';

type Props = {
  context: ResourceStoreContext | undefined;
  resourceData: any;
  timeout?: number;
  isStatic?: boolean;
};

export const createCombinedLoader = (props: Props) => {
  const { context, resourceData, isStatic } = props;
  const entryPoint = entryPointsLoader();
  const resources = resourcesLoader({
    context,
    resourceData,
    isStatic,
  });

  return combine(entryPoint, resources);
};
