/**
 * AppLayout — Main layout wrapper
 * 
 * Simple pass-through layout. Authentication system remains active,
 * but no sidebar UI is displayed.
 */
import React from 'react';

export function AppLayout({ children }) {
  return <>{children}</>;
}

export default AppLayout;
