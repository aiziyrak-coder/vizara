import { motion } from 'motion/react';

interface NeonTitleProps {
  text: string;
  as?: 'h1' | 'h2' | 'h3';
  className?: string;
  delay?: number;
}

export function NeonTitle({ text, as: Tag = 'h1', className = '', delay = 0 }: NeonTitleProps) {
  const words = text.split(' ');

  return (
    <Tag className={`neon-title ${className}`}>
      {words.map((word, wi) => (
        <span key={`${word}-${wi}`} className="neon-title-word">
          {word.split('').map((char, ci) => (
            <motion.span
              key={`${wi}-${ci}`}
              className="neon-title-char"
              initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{
                duration: 0.45,
                delay: delay + wi * 0.08 + ci * 0.025,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              {char}
            </motion.span>
          ))}
          {wi < words.length - 1 ? '\u00A0' : null}
        </span>
      ))}
    </Tag>
  );
}
