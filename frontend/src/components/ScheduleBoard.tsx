import { Clock, Moon, Sun, Sunrise, Sunset, Utensils } from 'lucide-react';
import type { DailySchedule, ScheduleEntry } from '../types';

interface Props {
  schedule: DailySchedule;
}

const SLOTS: {
  key: keyof DailySchedule;
  label: string;
  sublabel: string;
  icon: typeof Sunrise;
  accent: string;
}[] = [
  { key: 'morning', label: 'Morning', sublabel: 'With or before breakfast', icon: Sunrise, accent: 'border-amber-200 bg-amber-50/40' },
  { key: 'midday', label: 'Midday', sublabel: 'Around lunch', icon: Sun, accent: 'border-sky-200 bg-sky-50/40' },
  { key: 'evening', label: 'Evening', sublabel: 'Around dinner', icon: Sunset, accent: 'border-indigo-200 bg-indigo-50/40' },
  { key: 'bedtime', label: 'Bedtime', sublabel: 'Before sleep', icon: Moon, accent: 'border-purple-200 bg-purple-50/40' },
];

function SlotCard({
  label,
  sublabel,
  icon: Icon,
  accent,
  entries,
}: {
  label: string;
  sublabel: string;
  icon: typeof Sunrise;
  accent: string;
  entries: ScheduleEntry[];
}) {
  return (
    <div className={`rounded-xl border p-4 print-break-inside-avoid ${accent}`}>
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2.5">
        <Icon className="h-5 w-5 text-teal-700" />
        <div>
          <h4 className="font-semibold text-slate-900">{label}</h4>
          <p className="text-xs text-slate-500">{sublabel}</p>
        </div>
      </div>
      {entries.length === 0 ? (
        <p className="mt-3 text-xs italic text-slate-400">No scheduled medicines</p>
      ) : (
        <ul className="mt-3 space-y-2.5">
          {entries.map((entry, idx) => (
            <li
              key={`${entry.medication_name}-${idx}`}
              className={`rounded-lg border p-2.5 text-sm bg-white ${
                entry.ocr_confidence !== 'high'
                  ? 'border-amber-400 ring-1 ring-amber-300'
                  : 'border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-slate-900">{entry.medication_name}</span>
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-700">
                  {entry.dosage}
                </span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">{entry.instructions}</p>
              {entry.with_food !== null && entry.with_food !== undefined && (
                <div className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-teal-700">
                  <Utensils className="h-3 w-3" />
                  {entry.with_food ? 'Take with food' : 'Take on empty stomach'}
                </div>
              )}
              {entry.ocr_confidence !== 'high' && (
                <div className="mt-1.5 text-[11px] font-semibold text-amber-700">
                  ⚠ Unclear handwriting — confirm with pharmacist
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ScheduleBoard({ schedule }: Props) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {SLOTS.map((slot) => (
          <SlotCard
            key={slot.key}
            label={slot.label}
            sublabel={slot.sublabel}
            icon={slot.icon}
            accent={slot.accent}
            entries={schedule[slot.key]}
          />
        ))}
      </div>

      {schedule.as_needed.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 print-break-inside-avoid">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-teal-700" />
            <h4 className="font-semibold text-slate-900">As Needed (PRN)</h4>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            {schedule.as_needed.map((entry, idx) => (
              <div key={`${entry.medication_name}-prn-${idx}`} className="rounded-lg border border-slate-200 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900">{entry.medication_name}</span>
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                    {entry.dosage}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-600">{entry.instructions}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
