'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

export function Reveal({
  children,
  as: Tag = 'div',
  delay = 0,
}: {
  children: ReactNode;
  as?: 'div' | 'section' | 'li';
  delay?: number;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.1 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as never}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? 'none' : 'translateY(24px)',
        transition: `opacity var(--dur-reveal) var(--ease-apple) ${delay}ms, transform var(--dur-reveal) var(--ease-apple) ${delay}ms`,
      }}
    >
      {children}
    </Tag>
  );
}
