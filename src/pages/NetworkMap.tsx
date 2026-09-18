import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../services/store';
import { EmptyState, SectionHeading } from '../components/ui';
import { Router, Server } from 'lucide-react';

export default function NetworkMap() {
  const { activeAssessment, hosts } = useStore();
  const navigate = useNavigate();

  if (!activeAssessment) {
    return <EmptyState title="No assessment loaded" body="Select or create an assessment to view its network topology." />;
  }

  const aHosts = hosts.filter((h) => h.assessmentId === activeAssessment.id);

  return (
    <div>
      <SectionHeading title="Network Map" subtitle="Synthetic topology inferred from discovery data. Not a verified physical layout unless imported from a scan." />
      {aHosts.length === 0 ? (
        <EmptyState title="No topology data" body="Discover hosts or import scan results to populate the network map." />
      ) : (
        <div className="card p-10 flex flex-col items-center">
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 rounded-full bg-ink-700 border border-ink-600 flex items-center justify-center mb-1.5">
              <Router size={20} className="text-ink-200" />
            </div>
            <div className="text-xs text-ink-400 font-mono">{activeAssessment.scope}</div>
          </div>
          <div className="w-px h-8 bg-ink-700" />
          <div className="flex gap-8 flex-wrap justify-center">
            {aHosts.map((h) => (
              <button
                key={h.id}
                onClick={() => navigate(`/hosts/${h.id}`)}
                className="flex flex-col items-center group"
              >
                <div className="w-px h-8 bg-ink-700 -mt-8 mb-0" />
                <div className="w-11 h-11 rounded-full bg-ink-800 border border-ink-600 flex items-center justify-center mb-1.5 group-hover:border-signal-accent transition-colors">
                  <Server size={17} className="text-ink-200 group-hover:text-signal-accent" />
                </div>
                <div className="text-xs font-mono text-ink-200 group-hover:text-signal-accent">{h.ip}</div>
                <div className="text-[10px] text-ink-500">{h.hostname}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
