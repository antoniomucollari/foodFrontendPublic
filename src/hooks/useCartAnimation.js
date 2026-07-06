import { useEffect, useState } from 'react';

export const useCartAnimation = (cartItemCount) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [previousCount, setPreviousCount] = useState(0);

  useEffect(() => {
    if (cartItemCount > previousCount && previousCount > 0) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 600); // Animation duration

      return () => clearTimeout(timer);
    }
    setPreviousCount(cartItemCount);
  }, [cartItemCount, previousCount]);

  return isAnimating;
};



