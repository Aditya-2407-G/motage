import { useState, useEffect } from 'react';

export function useElementSize(ref) {
  const [size, setSize] = useState(null);

  useEffect(() => {
    if (!ref.current) return;
    
    const updateSize = () => {
      setSize({
        width: ref.current.offsetWidth,
        height: ref.current.offsetHeight
      });
    };
    
    updateSize();
    
    // Set up resize observer
    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(ref.current);
    
    return () => {
      if (ref.current) {
        resizeObserver.unobserve(ref.current);
      }
    };
  }, [ref]);

  return size;
}