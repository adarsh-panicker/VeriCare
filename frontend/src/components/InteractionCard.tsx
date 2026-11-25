import { AlertOctagon, AlertTriangle, ExternalLink, ShieldAlert } from 'lucide-react';
import type { DrugInteractionAlert } from '../types';

interface Props {
  alert: DrugInteractionAlert;
}

const SEVERITY_STYLES = {
  high: {
    wrapper: 'border-rose-200 border-l-4 border-l-rose-600 bg-gradient-to-r from-rose-50 via-white to-rose-50/40',
    badge: 'bg-rose-600 text-white shadow-xs',
    icon: AlertOctagon,
    iconWrap: 'bg-rose-100 text-rose-700',
    label: 'HIGH SEVERITY',
  },
  moderate: {
    wrapper: 'border-amber-200 border-l-4 border-l-amber-500 bg-gradient-to-r from-amber-50 via-white to-amber-50/40',
    badge: 'bg-amber-500 text-slate-950 shadow-xs',
    icon: AlertTriangle,
    iconWrap: 'bg-amber-100 text-amber-700',
    label: 'MODERATE',
  },
  low: {
    wrapper: 'border-sky-200 border-l-4 border-l-sky-500 bg-gradient-to-r from-sky-50 via-white to-sky-50/40',
    badge: 'bg-sky-600 text-white shadow-xs',
    icon: ShieldAlert,
    iconWrap: 'bg-sky-100 text-sky-700',
    label: 'LOW',
  },
};

export function InteractionCard({ alert }: Props) {
  const style = SEVERITY_STYLES[alert.severity];
  const Icon = style.icon;

  return (
    <div className={`rounded-2xl border p-5 shadow-sm transition-all hover:shadow-md print-break-inside-avoid ${style.wrapper}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${style.iconWrap}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-base font-bold text-slate-900">{alert.title}</h4>
            <p className="mt-0.5 text-xs font-medium text-slate-600">
              Flagged pair:{' '}
              <span className="rounded bg-white px-1.5 py-0.5 font-semibold text-slate-900 ring-1 ring-slate-200">
                {alert.drug_a}
              </span>{' '}
              +{' '}
              <span className="rounded bg-white px-1.5 py-0.5 font-semibold text-slate-900 ring-1 ring-slate-200">
                {alert.drug_b}
              </span>
            </p>
          </div>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold tracking-wide ${style.badge}`}>
          {style.label}
        </span>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-slate-800">{alert.plain_explanation}</p>

      <div className="mt-3 rounded-xl border border-slate-200/80 bg-white/90 p-3.5 text-sm text-slate-800">
        <span className="font-bold text-slate-900">What to watch for: </span>
        {alert.what_to_watch_for}
      </div>

      <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/60 pt-2.5 text-xs text-slate-600">
        <span>
          Source: <strong className="text-slate-800">{alert.source_citation}</strong>
        </span>
        {alert.source_url && (
          <a
            href={alert.source_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-teal-50 px-2.5 py-1 font-semibold text-teal-800 ring-1 ring-teal-200 transition hover:bg-teal-100"
          >
            View Official FDA / DailyMed Label
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}
