import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { usePrefersReducedMotion } from '../lib/motionPrefs';

const springTransition = {
  type: 'spring',
  stiffness: 420,
  damping: 36,
  mass: 0.72,
};

const AnimatedLayout = () => {
  const location = useLocation();
  const reduceMotion = usePrefersReducedMotion();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 18, filter: 'blur(6px)' }}
        animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, filter: 'blur(0px)' }}
        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -12, filter: 'blur(4px)' }}
        transition={
          reduceMotion
            ? { duration: 0.18 }
            : { ...springTransition, opacity: { duration: 0.35 } }
        }
        className="min-h-screen will-change-transform"
      >
        <Outlet />
      </motion.div>
    </AnimatePresence>
  );
};

export default AnimatedLayout;
