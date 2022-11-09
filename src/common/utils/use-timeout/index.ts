import { useCallback, useRef } from 'react';

export const useTimeout = (delay: number) => {
  const timeoutId = useRef<NodeJS.Timeout>();

  const schedule = useCallback(
    (callback: () => void) => {
      if (timeoutId.current) {
        clearTimeout(timeoutId.current);
      }

      timeoutId.current = setTimeout(callback, delay);
    },
    [delay]
  );

  const cancel = useCallback(() => {
    clearTimeout(timeoutId.current);
  }, []);

  return { schedule, cancel };
};
