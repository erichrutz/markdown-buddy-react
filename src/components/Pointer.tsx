import React, { useEffect, useRef, useCallback } from 'react';
import { Box } from '@mui/material';

interface PointerProps {
  active: boolean;
  zIndex?: number;
}

export const Pointer: React.FC<PointerProps> = ({ active, zIndex = 40 }) => {
  const posRef = useRef({ x: -100, y: -100 });
  const elRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);

  const onMove = useCallback(
    (e: MouseEvent) => {
      if (!active) return;
      const x = e.clientX;
      const y = e.clientY;
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = 0;
        posRef.current = { x, y };
        if (elRef.current) {
          elRef.current.style.left = `${x}px`;
          elRef.current.style.top = `${y}px`;
        }
      });
    },
    [active],
  );

  useEffect(() => {
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [onMove]);

  if (!active) return null;

  return (
    <Box
      ref={elRef}
      sx={{
        position: 'fixed',
        width: 26,
        height: 26,
        margin: '-13px 0 0 -13px',
        borderRadius: '50%',
        background: 'rgba(236,0,22,.28)',
        border: '2px solid #ef4444',
        pointerEvents: 'none',
        zIndex,
        left: posRef.current.x,
        top: posRef.current.y,
      }}
    />
  );
};
