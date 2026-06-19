import { motion, type HTMLMotionProps } from 'motion/react';
import type { ReactNode } from 'react';

interface RevealOnScrollProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  delay?: number;
  y?: number;
}

export function RevealOnScroll({
  children,
  delay = 0,
  y = 28,
  className = '',
  ...rest
}: RevealOnScrollProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
