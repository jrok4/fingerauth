import { useState, useRef, useCallback } from "react";

export function useTiltCard() {
  const [rx, setRx] = useState(0);
  const [ry, setRy] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const onMove = useCallback((e: React.MouseEvent) => {
    const el = cardRef.current;
    if (!el) return;
    const b = el.getBoundingClientRect();
    setRy(((e.clientX - b.left - b.width / 2) / (b.width / 2)) * 8);
    setRx((-(e.clientY - b.top - b.height / 2) / (b.height / 2)) * 8);
  }, []);

  const onLeave = useCallback(() => {
    setRx(0);
    setRy(0);
  }, []);

  return { rx, ry, cardRef, onMove, onLeave };
}