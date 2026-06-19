import { motion, type HTMLMotionProps } from 'motion/react';
import type { ReactNode } from 'react';

type RevealVariant = 'up' | 'scale' | 'left' | 'blur';

interface RevealOnScrollProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  delay?: number;
  y?: number;
  variant?: RevealVariant;
}

const variants: Record<RevealVariant, { initial: object; animate: object }> = {
  up: { initial: { opacity: 0, y: 36 }, animate: { opacity: 1, y: 0 } },
  scale: { initial: { opacity: 0, scale: 0.88, y: 20 }, animate: { opacity: 1, scale: 1, y: 0 } },
  left: { initial: { opacity: 0, x: -40 }, animate: { opacity: 1, x: 0 } },
  blur: { initial: { opacity: 0, y: 24, filter: 'blur(12px)' }, animate: { opacity: 1, y: 0, filter: 'blur(0px)' } },
};

export function RevealOnScroll({
  children,
  delay = 0,
  y,
  variant = 'up',
  className = '',
  ...rest
}: RevealOnScrollProps) {
  const v = variants[variant];
  const initial = y !== undefined ? { ...v.initial, y } : v.initial;

  return (
    <motion.div
      className={className}
      initial={initial}
      whileInView={v.animate}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.65, delay, ease: [0.16, 1, 0.3, 1] }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
