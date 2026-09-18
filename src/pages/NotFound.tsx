import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="text-center py-20">
      <div className="text-lg text-ink-100 mb-1">Page not found</div>
      <div className="text-sm text-ink-400 mb-4">This section does not exist in ANPT Toolkit.</div>
      <Link to="/" className="text-signal-accent text-sm hover:underline">Return to Dashboard</Link>
    </div>
  );
}
