import { useState, useLayoutEffect } from 'react';
import { MQ_MAX } from '~/lib/constants';

export const useDevice = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTouch, setIsTouch] = useState(false);

  useLayoutEffect(() => {
    // is mobile
    const updateIsMobile = (e) => {
      setIsMobile(e.matches);
    };

    const mql = window.matchMedia(MQ_MAX);
    mql.addEventListener('change', updateIsMobile);
    updateIsMobile(mql);

    // is Touch
    if (window.ontouchstart !== undefined) {
      setIsTouch(true);
    }

    return () => window.removeEventListener('resize', updateIsMobile);
  }, []);

  return { isMobile, isTouch };
};
