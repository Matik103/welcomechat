
import { useEffect } from 'react';

/**
 * A hook that runs an effect only once when the component mounts
 * @param effect The effect to run
 */
export const useMountEffect = (effect: () => void | (() => void)) => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(effect, []);
};
