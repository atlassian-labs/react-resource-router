import { useRouter } from '../../controllers/use-router';

export const useEntryPoint = (): any => {
  const [{ route }] = useRouter();

  return route?.entryPoint ?? undefined; // loadEntryPoint(...)
};
