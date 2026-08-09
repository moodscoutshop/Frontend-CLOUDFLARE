import { useEffect, useState } from 'react';

const LIGHT = {
  grid: '#E8E4D9',
  tick: '#5D5F60',
  tooltipBg: '#FFFFFF',
  tooltipBorder: '#D4CFC0',
  tooltipLabel: '#1D1F20',
  tooltipText: '#3D3F40',
  cursor: '#EEEFE9',
  legend: '#5D5F60',
};

const DARK = {
  grid: '#353343',
  tick: '#D7C3AF',
  tooltipBg: '#1C1A28',
  tooltipBorder: '#3A3648',
  tooltipLabel: '#E5DFF4',
  tooltipText: '#D7C3AF',
  cursor: '#201E2D',
  legend: '#D7C3AF',
};

function readIsDark() {
  if (typeof document === 'undefined') return false;
  return document.documentElement.classList.contains('dark');
}

/**
 * Theme-aware palette for Recharts (tooltips, axes, cursor, legend).
 * Tracks `html.dark` via MutationObserver so toggles update live.
 */
export function useChartTheme() {
  const [isDark, setIsDark] = useState(readIsDark);

  useEffect(() => {
    const update = () => setIsDark(readIsDark());
    update();
    const obs = new MutationObserver(update);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  return isDark ? DARK : LIGHT;
}

export default useChartTheme;
