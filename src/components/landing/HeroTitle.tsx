import { motion } from 'motion/react';

interface HeroTitleProps {
  line1: string;
  highlight: string;
  line2?: string;
  className?: string;
}

export function HeroTitle({ line1, highlight, line2, className = '' }: HeroTitleProps) {
  return (
    <h1 className={`landing-hero-headline ${className}`}>
      <motion.span
        className="landing-hero-headline-line"
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        {line1}{' '}
        <span className="landing-hero-headline-accent">{highlight}</span>
      </motion.span>
      {line2 && (
        <motion.span
          className="landing-hero-headline-line block"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          {line2}
        </motion.span>
      )}
    </h1>
  );
}
