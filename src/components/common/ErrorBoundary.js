import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { API_URL } from '../../lib/api';

/**
 * App-level error boundary.
 *
 * Catches uncaught render errors, shows a friendly fallback, and reports the
 * crash to the backend (/api/report, type=auto) so it shows up in the admin
 * Reports tab. Reporting is best-effort and never throws.
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    try {
      const body = JSON.stringify({
        type: 'auto',
        source: 'frontend',
        severity: 'crash',
        message: error?.message || 'Render error',
        stack: (error?.stack || '') + '\n\nComponent stack:' + (info?.componentStack || ''),
        url: typeof window !== 'undefined' ? window.location.href : '',
        context: { boundary: 'app' },
      });
      // Use keepalive so the report survives a navigation/reload.
      fetch(`${API_URL}/api/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => {});
    } catch (_) {
      /* swallow */
    }
  }

  handleReload = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#FDFDF8] px-4">
          <div className="max-w-md text-center">
            <div className="w-14 h-14 rounded-full bg-[#FDF4E3] flex items-center justify-center mx-auto mb-5">
              <AlertTriangle className="w-7 h-7 text-[#EB9D2A]" />
            </div>
            <h1 className="text-2xl font-bold text-[#1D1F20] mb-2">Something went wrong</h1>
            <p className="text-[#5D5F60] mb-6">
              We hit an unexpected error and our team has been notified. Try reloading the page.
            </p>
            <button onClick={this.handleReload} className="btn-primary inline-flex items-center gap-2">
              <RefreshCw className="w-4 h-4" /> Reload page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
