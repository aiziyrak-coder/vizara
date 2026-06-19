import { useRef, type ReactNode, type MouseEvent } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';

interface TiltGlowCardProps {
  children: ReactNode;
  className?: string;
  glow?: 'ar' | 'tour' | 'neutral';
  onClick?: () => void;
}

export function TiltGlowCard({ children, className = '', glow = 'neutral', onClick }: TiltGlowCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [8, -8]), { stiffness: 260, damping: 22 });
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-8, 8]), { stiffness: 260, damping: 22 });
  const glareX = useSpring(useTransform(mx, [-0.5, 0.5], [0, 100]), { stiffness: 200, damping: 25 });
  const glareY = useSpring(useTransform(my, [-0.5, 0.5], [0, 100]), { stiffness: 200, damping: 25 });

  const onMove = (e: MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    mx.set((e.clientX - rect.left) / rect.width - 0.5);
    my.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const onLeave = () => {
    mx.set(0);
    my.set(0);
  };

  return (
    <motion.div
      ref={ref}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
      className={`tilt-glow-card tilt-glow-card--${glow} ${className}`}
      style={{ rotateX, rotateY, transformPerspective: 900 }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      whileTap={onClick ? { scale: 0.98 } : undefined}
    >
      <motion.div
        className="tilt-glow-card-glare"
        style={{ left: glareX, top: glareY }}
        aria-hidden
      />
      <div className="tilt-glow-card-border" aria-hidden />
      {children}
    </motion.div>
  );
}
