import { useEffect } from 'react';
import { motion, useAnimation, useMotionValue } from 'motion/react';
import './componentLogomark.css';

// ─── Rotation helpers (from CircularText) ─────────────────────────────────

const getRotationTransition = (duration, from, loop = true) => ({
  from,
  to: from + 360,
  ease: 'linear',
  duration,
  type: 'tween',
  repeat: loop ? Infinity : 0,
});

const getTransition = (duration, from) => ({
  rotate: getRotationTransition(duration, from),
  scale: { type: 'spring', damping: 20, stiffness: 300 },
});

export default function LogoMark({ size = 88, spinDuration = 22, className = '' }) {
  const text = 'efaC ehT • zeyE poP • ';
  const letters = Array.from(text);
  const controls = useAnimation();
  const rotation = useMotionValue(0);

  const radius = size * 0.35;

  const circumference = 2 * Math.PI * radius;
  const avgAdvance = 0.55;
  const fontSizeFromFit = circumference / (letters.length * avgAdvance);
  const fontSize = Math.min(Math.max(fontSizeFromFit, 6), size * 0.16);

  useEffect(() => {
    const start = rotation.get();
    controls.start({
      rotate: start + 360,
      scale: 1,
      transition: getTransition(spinDuration, start),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleHoverStart = () => {
    const start = rotation.get();
    controls.start({
      rotate: start + 360,
      scale: 1,
      transition: getTransition(spinDuration / 4, start),
    });
  };

  const handleHoverEnd = () => {
    const start = rotation.get();
    controls.start({
      rotate: start + 360,
      scale: 1,
      transition: getTransition(spinDuration, start),
    });
  };

  return (
    <div
      className={`logo-mark ${className}`}
      style={{ width: size, height: size }}
      onMouseEnter={handleHoverStart}
      onMouseLeave={handleHoverEnd}
    >
      {/* Spinning circular text — nothing in the center */}
      <motion.div
        className="logo-mark__ring"
        style={{ rotate: rotation }}
        initial={{ rotate: 0 }}
        animate={controls}
      >
        {letters.map((letter, i) => {
          const angleDeg = (360 / letters.length) * i;
          // Position each letter on the circle, then rotate it so its
          // baseline follows the curve (reads outward from center).
          const transform = `translate(-50%, -50%) rotate(${angleDeg}deg) translate(0, -${radius}px) rotate(180deg)`;
          return (
            <span
              key={i}
              className="logo-mark__letter"
              style={{ transform, fontSize: `${fontSize}px` }}
            >
              {letter}
            </span>
          );
        })}
      </motion.div>
    </div>
  );
}