import React from 'react';
import { Severity } from '../types';

const severityStyles: Record<Severity, string> = {
  Critical: 'bg-signal-crit/15 text-signal-crit border-signal-crit/30',
  High: 'bg-signal-high/15 text-signal-high border-signal-high/30',
  Medium: 'bg-signal-med/15 text-signal-med border-signal-med/30',
  Low: 'bg-signal-low/15 text-signal-low border-signal-low/30',
  Informational: 'bg-signal-info/15 text-signal-info border-signal-info/30',
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm border text-xs font-medium ${severityStyles[severity]}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {severity}
    </span>
  );
}

export function StatusPill({ label, tone }: { label: string; tone: 'ok' | 'warn' | 'crit' | 'neutral' | 'accent' }) {
  const map: Record<string, string> = {
    ok: 'bg-signal-ok/15 text-signal-ok border-signal-ok/30',
    warn: 'bg-signal-med/15 text-signal-med border-signal-med/30',
    crit: 'bg-signal-crit/15 text-signal-crit border-signal-crit/30',
    neutral: 'bg-ink-700/40 text-ink-200 border-ink-600',
    accent: 'bg-signal-accent/15 text-signal-accent border-signal-accent/30',
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-sm border text-xs font-medium ${map[tone]}`}>{label}</span>;
}

export function StatCard({ label, value, tone }: { label: string; value: React.ReactNode; tone?: 'ok' | 'warn' | 'crit' | 'accent' | 'neutral' }) {
  const toneColor: Record<string, string> = {
    ok: 'text-signal-ok',
    warn: 'text-signal-med',
    crit: 'text-signal-crit',
    accent: 'text-signal-accent',
    neutral: 'text-ink-100',
  };
  return (
    <div className="card px-4 py-3.5">
      <div className="text-[11px] tracking-wide text-ink-300 mb-1">{label}</div>
      <div className={`text-2xl font-semibold font-mono ${toneColor[tone || 'neutral']}`}>{value}</div>
    </div>
  );
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="card flex flex-col items-center justify-center text-center py-16 px-6">
      <div className="text-base font-medium text-ink-100 mb-1.5">{title}</div>
      <div className="text-sm text-ink-300 max-w-sm mb-5">{body}</div>
      {action}
    </div>
  );
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  type = 'button',
  disabled,
  className = '',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  type?: 'button' | 'submit';
  disabled?: boolean;
  className?: string;
}) {
  const base = 'inline-flex items-center gap-2 px-3.5 py-2 rounded text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed';
  const variants: Record<string, string> = {
    primary: 'bg-signal-accent text-white hover:bg-[#6A5EE0]',
    secondary: 'bg-ink-700 text-ink-100 hover:bg-ink-600 border border-ink-600',
    ghost: 'text-ink-200 hover:bg-ink-800',
    danger: 'bg-signal-crit/15 text-signal-crit border border-signal-crit/30 hover:bg-signal-crit/25',
  };
  return (
    <button type={type} disabled={disabled} onClick={onClick} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
}

export function SectionHeading({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-5">
      <div>
        <h1 className="text-lg font-semibold text-ink-100">{title}</h1>
        {subtitle && <p className="text-sm text-ink-300 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
