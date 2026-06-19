import { motion } from 'motion/react';
import { Box, Map } from 'lucide-react';
import { VizaraMark } from '../VizaraMark';

export function HeroVisual() {
  return (
    <div className="landing-hero-visual" aria-hidden="true">
      <div className="landing-hero-visual-ring landing-hero-visual-ring-1" />
      <div className="landing-hero-visual-ring landing-hero-visual-ring-2" />
      <div className="landing-hero-visual-ring landing-hero-visual-ring-3" />
      <motion.div
        className="landing-hero-visual-core"
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
      >
        <VizaraMark height={100} animated />
      </motion.div>
      <motion.div
        className="landing-hero-float landing-hero-float-ar"
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Box className="w-5 h-5" />
        <span>VizaraAR</span>
      </motion.div>
      <motion.div
        className="landing-hero-float landing-hero-float-tour"
        animate={{ y: [0, 12, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
      >
        <Map className="w-5 h-5" />
        <span>VizaraTour</span>
      </motion.div>
    </div>
  );
}
