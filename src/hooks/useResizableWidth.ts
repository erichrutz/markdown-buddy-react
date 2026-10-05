import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Tracks a draggable panel width. `edge` is which side of the panel the
 * drag handle sits on — 'right' grows the panel when dragging right,
 * 'left' grows it when dragging left (e.g. a right-hand sidebar).
 */
export function useResizableWidth(initial: number, min: number, max: number, edge: 'left' | 'right' = 'right') {
  const [width, setWidth] = useState(initial);
  const draggingRef = useRef(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    draggingRef.current = true;
    startXRef.current = e.clientX;
    startWidthRef.current = width;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [width]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!draggingRef.current) return;
      const delta = e.clientX - startXRef.current;
      const next = edge === 'right' ? startWidthRef.current + delta : startWidthRef.current - delta;
      setWidth(Math.min(max, Math.max(min, next)));
    };
    const onUp = () => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [edge, min, max]);

  return { width, onMouseDown };
}
