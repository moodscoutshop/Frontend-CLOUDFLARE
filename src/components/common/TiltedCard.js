import { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

const springValues = {
  damping: 30,
  stiffness: 100,
  mass: 2
};

/**
 * TiltedCard - 3D tilting card effect with mouse tracking
 * @param {string} containerHeight - Height of the card container
 * @param {string} containerWidth - Width of the card container
 * @param {number} scaleOnHover - Scale factor on hover (default: 1.05)
 * @param {number} rotateAmplitude - Rotation intensity (default: 12)
 * @param {boolean} showMobileWarning - Show mobile warning message
 * @param {ReactNode} overlayContent - Content to display as overlay (uses translateZ)
 * @param {ReactNode} children - Main card content
 */
export default function TiltedCard({
  containerHeight = '100%',
  containerWidth = '100%',
  scaleOnHover = 1.05,
  rotateAmplitude = 12,
  showMobileWarning = false,
  overlayContent = null,
  children
}) {
  const ref = useRef(null);
  const rotateX = useSpring(useMotionValue(0), springValues);
  const rotateY = useSpring(useMotionValue(0), springValues);
  const scale = useSpring(1, springValues);

  function handleMouse(e) {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left - rect.width / 2;
    const offsetY = e.clientY - rect.top - rect.height / 2;

    const rotationX = (offsetY / (rect.height / 2)) * -rotateAmplitude;
    const rotationY = (offsetX / (rect.width / 2)) * rotateAmplitude;

    rotateX.set(rotationX);
    rotateY.set(rotationY);
  }

  function handleMouseEnter() {
    scale.set(scaleOnHover);
  }

  function handleMouseLeave() {
    scale.set(1);
    rotateX.set(0);
    rotateY.set(0);
  }

  return (
    <div
      ref={ref}
      className="relative w-full h-full [perspective:800px]"
      style={{
        height: containerHeight,
        width: containerWidth
      }}
      onMouseMove={handleMouse}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {showMobileWarning && (
        <div className="absolute top-4 text-center text-sm block sm:hidden">
          This effect is not optimized for mobile. Check on desktop.
        </div>
      )}

      <motion.div
        className="relative [transform-style:preserve-3d]"
        style={{
          rotateX,
          rotateY,
          scale
        }}
      >
        {/* Main content layer */}
        {children}

        {/* Overlay content with 3D depth */}
        {overlayContent && (
          <div className="absolute top-0 left-0 will-change-transform [transform:translateZ(30px)] pointer-events-none">
            {overlayContent}
          </div>
        )}
      </motion.div>
    </div>
  );
}
