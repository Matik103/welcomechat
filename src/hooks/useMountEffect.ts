import { useEffect } from 'react';

/**
 * A hook that runs an effect only once when the component mounts
 * @param effect The effect to run
 */
export const useMountEffect = (effect: () => void) => {
  useEffect(() => {
    effect();
  }, []); // Empty dependency array means this effect runs once on mount
};
