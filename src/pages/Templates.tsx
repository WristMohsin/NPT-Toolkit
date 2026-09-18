import React from 'react';
import { SectionHeading, EmptyState } from '../components/ui';

export default function Templates() {
  return (
    <div>
      <SectionHeading title="Report Templates" subtitle="Manage report layouts for Executive, Technical, Host, and Finding reports." />
      <EmptyState
        title="Template management coming soon"
        body="Report content is currently generated from the built-in Executive Summary and Technical Report layouts in the Reports page. Custom templates are on the roadmap."
      />
    </div>
  );
}
