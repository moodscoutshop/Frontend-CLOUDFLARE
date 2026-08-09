// The existing production property remains the fallback while deployments move
// the value into REACT_APP_GA_MEASUREMENT_ID.
const measurementId = process.env.REACT_APP_GA_MEASUREMENT_ID || 'G-B8KR8DW8FC';
let initialized = false;

export function installAnalytics() {
  if (initialized || !measurementId || typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', measurementId, { send_page_view: false });
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  document.head.appendChild(script);
  initialized = true;
}

export function trackEvent(eventName, params = {}) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') window.gtag('event', eventName, params);
}
