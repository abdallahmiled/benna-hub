import { useEffect, useState } from 'react';

/** Préférence système : moins d’animations (accessibilité). */
export function prefersReducedMotion() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Hook React : se met à jour si l’utilisateur change le réglage OS. */
export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() => prefersReducedMotion());
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const fn = () => setReduced(mq.matches);
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, []);
  return reduced;
}
