import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';

/**
 * ImageGrid - Responsive grid for displaying images with dynamic columns.
 *
 * Layout rules:
 * 1. Columns = ceil(sqrt(imageCount)), capped at maxCols.
 *    This keeps the grid square (NxN) until the column limit is hit,
 *    after which only the row count grows (rectangular).
 * 2. Images fill the full available container width.
 *    imageSize = (containerWidth - (cols-1)*gap) / cols
 *    Clamped to [minImageSize, Infinity) so images stay usable.
 *
 * Props:
 * ──────────────────────────────────────────────
 * images          {Array}    Required. Array of image source URLs or objects
 *                            with { src, alt? } shape.
 * renderImage     {Function} Optional render-prop (image, index, imageSize) → ReactNode.
 * maxColsMobile   {number}   Max columns on mobile (default 2)
 * maxColsDesktop  {number}   Max columns on desktop (default 5)
 * mobileBreakpoint {number}  px breakpoint (default 640, matches Tailwind `sm`)
 * minImageSize    {number}   Minimum px width/height per image (default 56)
 * gap             {number}   Grid gap in px (default 8)
 * className       {string}   Extra class names on the outer wrapper
 * animate         {boolean}  Use framer-motion entrance animation (default true)
 */
export default function ImageGrid({
  images = [],
  renderImage,
  maxColsMobile = 2,
  maxColsDesktop = 5,
  mobileBreakpoint = 640,
  minImageSize = 56,
  gap = 8,
  className = '',
  animate = true,
}) {
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // ── Responsive max-cols ─────────────────────────────
  const [maxCols, setMaxCols] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth < mobileBreakpoint
      ? maxColsMobile
      : maxColsDesktop
  );

  useEffect(() => {
    const onResize = () => {
      setMaxCols(
        window.innerWidth < mobileBreakpoint ? maxColsMobile : maxColsDesktop
      );
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [maxColsMobile, maxColsDesktop, mobileBreakpoint]);

  // ── Measure container width ─────────────────────────
  const measure = useCallback(() => {
    if (containerRef.current) {
      setContainerWidth(containerRef.current.offsetWidth);
    }
  }, []);

  useEffect(() => {
    measure(); // initial measurement
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure]);

  // Re-measure when images change (container may appear/resize)
  useEffect(() => {
    measure();
  }, [images.length, measure]);

  // ── Derived layout values ───────────────────────────
  const { cols, imageSize } = useMemo(() => {
    const count = images.length;
    if (count === 0) return { cols: 1, imageSize: 0 };

    // Square grid: cols = ceil(sqrt(n)), capped at maxCols
    const squareCols = Math.ceil(Math.sqrt(count));
    const computedCols = Math.min(squareCols, maxCols);

    // Fill available width: size = (width - gaps) / cols
    if (containerWidth > 0) {
      const totalGap = (computedCols - 1) * gap;
      const rawSize = Math.floor((containerWidth - totalGap) / computedCols);
      const computedSize = Math.max(rawSize, minImageSize);
      return { cols: computedCols, imageSize: computedSize };
    }

    // Fallback before first measurement
    return { cols: computedCols, imageSize: minImageSize };
  }, [images.length, maxCols, containerWidth, gap, minImageSize]);

  if (images.length === 0) return null;

  // Normalise to { src, alt }
  const items = images.map((img, i) =>
    typeof img === 'string' ? { src: img, alt: `image-${i + 1}` } : img
  );

  // ── Container style ─────────────────────────────────
  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: `repeat(${cols}, ${imageSize}px)`,
    gap: `${gap}px`,
    justifyContent: 'center',
    justifyItems: 'center',
  };

  const Wrapper = animate ? motion.div : 'div';
  const wrapperProps = animate
    ? {
        initial: { opacity: 0, scale: 0.96 },
        animate: { opacity: 1, scale: 1 },
        transition: { duration: 0.2 },
      }
    : {};

  return (
    <div ref={containerRef} className="w-full">
      <Wrapper style={gridStyle} className={className} {...wrapperProps}>
        {items.map((item, index) => {
          const cellStyle = {
            width: imageSize,
            height: imageSize,
          };

          const CellWrapper = animate ? motion.div : 'div';
          const cellProps = animate
            ? {
                initial: { opacity: 0, scale: 0.85 },
                animate: { opacity: 1, scale: 1 },
                transition: { delay: index * 0.03, duration: 0.2 },
              }
            : {};

          return (
            <CellWrapper key={index} style={cellStyle} className="relative" {...cellProps}>
              {renderImage ? (
                renderImage(item, index, imageSize)
              ) : (
                <img
                  src={item.src}
                  alt={item.alt || ''}
                  className="w-full h-full object-cover rounded-lg border border-[#D4CFC0]"
                  draggable={false}
                />
              )}
            </CellWrapper>
          );
        })}
      </Wrapper>
    </div>
  );
}
