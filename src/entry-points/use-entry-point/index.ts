import { useRouter } from '../../controllers/use-router';

export const useEntryPoint = (): any => {
  const [{ route }] = useRouter();

  if (!route.entryPoint) {
    return undefined;
  }

  return { entryPointReference: route?.entryPoint }; // loadEntryPoint(...)
};
