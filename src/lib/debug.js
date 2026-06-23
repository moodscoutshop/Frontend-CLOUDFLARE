/**
 * Frontend debug logger.
 *
 * Controlled by REACT_APP_DEBUG_MODE (set in the build environment):
 *   - REACT_APP_DEBUG_MODE=true -> debug output is printed to the browser console
 *   - anything else             -> debug/info/log are suppressed so production
 *                                  users never see internal debug output.
 *
 * `warn` and `error` always print so genuine problems remain visible.
 *
 * NOTE: Create React App inlines REACT_APP_* vars at build time, so the value
 * is fixed per deployed bundle.
 */

const DEBUG = String(process.env.REACT_APP_DEBUG_MODE).toLowerCase() === 'true';

const noop = () => {};

export const debug = {
  enabled: DEBUG,
  log: DEBUG ? (...args) => console.log(...args) : noop,
  info: DEBUG ? (...args) => console.info(...args) : noop,
  debug: DEBUG ? (...args) => console.debug(...args) : noop,
  warn: (...args) => console.warn(...args),
  error: (...args) => console.error(...args),
};

export default debug;
