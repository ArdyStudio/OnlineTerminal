import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';

interface CountdownOverlayProps {
  onComplete: () => void;
  countKey: number; // Increment to reset
}

export function CountdownOverlay({ onComplete, countKey }: CountdownOverlayProps) {
  const [count, setCount] = useState(3);

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const hasFiredRef = useRef(false);
  
  useEffect(() => {
    hasFiredRef.current = false;
  }, [countKey]);

  useEffect(() => {
    if (count === 0 && !hasFiredRef.current) {
      hasFiredRef.current = true;
      onCompleteRef.current();
    }
  }, [count]);

  useEffect(() => {
    setCount(3);
    const timer = setInterval(() => {
      setCount((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countKey]);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
      <AnimatePresence mode="wait">
        {count > 0 ? (
          <motion.div
            key={count}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1.2, opacity: 1 }}
            exit={{ scale: 2, opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="text-9xl font-serif text-gold drop-shadow-[0_0_15px_rgba(197,160,89,0.5)]"
          >
            {count}
          </motion.div>
        ) : (
          <motion.div
            key="capture"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="text-7xl font-serif text-white uppercase tracking-widest italic"
          >
            Capture!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
