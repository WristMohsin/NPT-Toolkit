import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard, ClipboardList, Crosshair, PlayCircle, ScrollText,
  Server, Network, Map, ShieldAlert, FileWarning, FolderOpen,
  FileText, LayoutTemplate, Import, FileOutput, Settings, ChevronLeft, ChevronRight, Search, BarChart3,
} from 'lucide-react';
import { useStore } from '../services/store';
import { StatusPill } from '../components/ui';

const navGroups: Array<{ label: string; items: Array<{ to: string; label: string; icon: React.ElementType }> }> = [
  {
    label: 'Command Center',
    items: [{ to: '/', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'Assessment',
    items: [
      { to: '/assessments', label: 'Assessments', icon: ClipboardList },
      { to: '/targets', label: 'Targets', icon: Crosshair },
      { to: '/automation', label: 'Automation', icon: PlayCircle },
      { to: '/logs', label: 'Execution Logs', icon: ScrollText },
    ],
  },
  {
    label: 'Discovery',
    items: [
      { to: '/hosts', label: 'Hosts', icon: Server },
      { to: '/services', label: 'Services', icon: Network },
      { to: '/network-map', label: 'Network Map', icon: Map },
    ],
  },
  {
    label: 'Security',
    items: [
      { to: '/vulnerabilities', label: 'Vulnerabilities', icon: ShieldAlert },
      { to: '/findings', label: 'Findings', icon: FileWarning },
      { to: '/evidence', label: 'Evidence', icon: FolderOpen },
    ],
  },
  {
    label: 'Reporting',
    items: [
      { to: '/reports', label: 'Reports', icon: FileText },
      { to: '/templates', label: 'Templates', icon: LayoutTemplate },
      { to: '/analytics', label: 'Analytics', icon: BarChart3 },
    ],
  },
  {
    label: 'Data',
    items: [
      { to: '/import', label: 'Import Center', icon: Import },
      { to: '/export', label: 'Export Center', icon: FileOutput },
    ],
  },
  {
    label: 'System',
    items: [{ to: '/settings', label: 'Settings', icon: Settings }],
  },
];

export default function AppShell() {
  const [collapsed, setCollapsed] = useState(false);
  const { activeAssessment } = useStore();

  return (
    <div className="min-h-screen flex bg-ink-950">
      <aside
        className={`no-print ${collapsed ? 'w-[64px]' : 'w-[228px]'} shrink-0 border-r border-ink-800 bg-ink-900 flex flex-col transition-all duration-150`}
      >
        <div className="h-14 flex items-center px-4 border-b border-ink-800">
          <div className="w-7 h-7 rounded bg-signal-accent/20 border border-signal-accent/40 flex items-center justify-center shrink-0">
            <ShieldAlert size={15} className="text-signal-accent" />
          </div>
          {!collapsed && (
            <div className="ml-2.5 leading-tight overflow-hidden">
              <div className="text-sm font-semibold text-ink-100 whitespace-nowrap">ANPT Toolkit</div>
              <div className="text-[10px] text-ink-400 whitespace-nowrap">Authorized Assessment</div>
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-3">
          {navGroups.map((group) => (
            <div key={group.label} className="mb-4 px-2">
              {!collapsed && (
                <div className="px-2 text-[10px] tracking-wider text-ink-400 mb-1.5">{group.label}</div>
              )}
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-2.5 py-1.5 rounded-sm text-sm mb-0.5 transition-colors ${
                      isActive ? 'bg-signal-accent/15 text-signal-accent' : 'text-ink-200 hover:bg-ink-800 hover:text-ink-100'
                    }`
                  }
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon size={15} className="shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <button
          onClick={() => setCollapsed((c) => !c)}
          className="h-10 flex items-center justify-center border-t border-ink-800 text-ink-400 hover:text-ink-100"
        >
          {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
        </button>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="no-print h-14 border-b border-ink-800 bg-ink-900/60 flex items-center justify-between px-5 shrink-0">
          <div className="flex items-center gap-2 text-ink-300 text-sm">
            <Search size={14} />
            <span className="text-ink-400">Search hosts, findings, assessments</span>
            <kbd className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-ink-800 border border-ink-700 text-ink-400 font-mono">Ctrl K</kbd>
          </div>
          <div className="flex items-center gap-3">
            {activeAssessment ? (
              <span className="text-sm text-ink-200">
                Assessment: <span className="font-mono text-ink-100">{activeAssessment.id}</span>
              </span>
            ) : (
              <span className="text-sm text-ink-400">No active assessment</span>
            )}
            {activeAssessment && (
              <StatusPill
                label={activeAssessment.executionMode === 'Demo' ? 'DEMO MODE' : activeAssessment.executionMode.toUpperCase()}
                tone={activeAssessment.executionMode === 'Demo' ? 'accent' : 'neutral'}
              />
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>

        <footer className="no-print h-9 border-t border-ink-800 bg-ink-900/60 flex items-center justify-between px-5 text-xs text-ink-400 shrink-0">
          <span>
            Agent: {activeAssessment?.executionMode === 'Agent' ? 'Connected' : activeAssessment?.executionMode || 'Demo / Offline'}
          </span>
          <span>Scope: {activeAssessment ? 'Authorized' : 'No assessment loaded'}</span>
        </footer>
      </div>
    </div>
  );
}
