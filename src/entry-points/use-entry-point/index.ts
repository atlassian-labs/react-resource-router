import { useRouter } from '../../controllers/use-router';

export const useEntryPoint = (): any => {
  const [{ route }] = useRouter();

  // @ts-expect-error as EntryPoint is missing in Route definition for now
  if (!route || !route.entryPoint) {
    return undefined;
  }

  // @ts-expect-error as EntryPoint is missing in Route definition for now
  return { entryPoint: route?.entryPoint }; // loadEntryPoint(...)
};
