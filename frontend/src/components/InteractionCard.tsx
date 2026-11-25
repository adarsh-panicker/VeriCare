import { AlertOctagon, AlertTriangle, ExternalLink, ShieldAlert } from 'lucide-react';
import type { DrugInteractionAlert } from '../types';

interface Props {
  alert: DrugInteractionAlert;
}

const SEVERITY_STYLES = {
  high: {
    wrapper: 'border-rose-300 bg-rose-50/90',
    badge: 'bg-rose-600 text-white',
    icon: AlertOctagon,
    iconColor: 'text-rose-600',
    label: 'HIGH SEVERITY',
  },
  moderate: {
    wrapper: 'border-amber-300 bg-amber-50/90',
    badge: 'bg-amber-500 text-slate-950',
    icon: AlertTriangle,
    iconColor: 'text-amber-600',
    label: 'MODERATE',
  },
  low: {
    wrapper: 'border-sky-300 bg-sky-50/90',
    badge: 'bg-sky-600 text-white',
    icon: ShieldAlert,
    iconColor: 'text-sky-600',
    label: 'LOW',
  },
};

export function InteractionCard({ alert }: Props) {
  const style = SEVERITY_STYLES[alert.severity];
  const Icon = style.icon;

  return (
    <div className={`rounded-xl border-2 p-4 shadow-xs print-break-inside-avoid ${style.wrapper}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <Icon className={`h-5 w-5 shrink-0 ${style.iconColor}`} />
          <h4 className="font-semibold text-slate-900">{alert.title}</h4>
        </div>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold tracking-wide ${style.badge}`}>
          {style.label}
        </span>
      </div>

      <p className="mt-2 text-xs font-medium text-slate-600">
        Flagged pair: <span className="font-semibold text-slate-900">{alert.drug_a}</span> +{' '}
        <span className="font-semibold text-slate-900">{alert.drug_b}</span>
      </p>

      <p className="mt-2 text-sm leading-relaxed text-slate-800">{alert.plain_explanation}</p>

      <div className="mt-3 rounded-lg bg-white/80 p-3 text-sm text-slate-800 border border-slate-200/80">
        <span className="font-semibold text-slate-900">What to watch for: </span>
        {alert.what_to_watch_for}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
        <span>
          Source: <strong className="text-slate-800">{alert.source_citation}</strong>
        </span>
        {alert.source_url && (
          <a
            href={alert.source_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-semibold text-teal-700 hover:text-teal-900 underline"
          >
            View Official FDA / DailyMed Label
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}
