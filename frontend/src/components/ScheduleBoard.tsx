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
  headerBg: string;
  iconColor: string;
  cardBorder: string;
}[] = [
  {
    key: 'morning',
    label: 'Morning',
    sublabel: 'With or before breakfast',
    icon: Sunrise,
    headerBg: 'bg-gradient-to-r from-amber-100/90 to-orange-50',
    iconColor: 'text-amber-600',
    cardBorder: 'border-amber-200/80',
  },
  {
    key: 'midday',
    label: 'Midday',
    sublabel: 'Around lunch',
    icon: Sun,
    headerBg: 'bg-gradient-to-r from-sky-100/90 to-cyan-50',
    iconColor: 'text-sky-600',
    cardBorder: 'border-sky-200/80',
  },
  {
    key: 'evening',
    label: 'Evening',
    sublabel: 'Around dinner',
    icon: Sunset,
    headerBg: 'bg-gradient-to-r from-indigo-100/90 to-blue-50',
    iconColor: 'text-indigo-600',
    cardBorder: 'border-indigo-200/80',
  },
  {
    key: 'bedtime',
    label: 'Bedtime',
    sublabel: 'Before sleep',
    icon: Moon,
    headerBg: 'bg-gradient-to-r from-purple-100/90 to-fuchsia-50',
    iconColor: 'text-purple-600',
    cardBorder: 'border-purple-200/80',
  },
];

function SlotCard({
  label,
  sublabel,
  icon: Icon,
  headerBg,
  iconColor,
  cardBorder,
  entries,
}: {
  label: string;
  sublabel: string;
  icon: typeof Sunrise;
  headerBg: string;
  iconColor: string;
  cardBorder: string;
  entries: ScheduleEntry[];
}) {
  return (
    <div className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition-all hover:shadow-md print-break-inside-avoid ${cardBorder}`}>
      <div className={`flex items-center gap-2.5 border-b border-slate-100 px-4 py-3 ${headerBg}`}>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/80 shadow-xs">
          <Icon className={`h-4 w-4 ${iconColor}`} />
        </div>
        <div>
          <h4 className="text-sm font-bold text-slate-900">{label}</h4>
          <p className="text-[11px] font-medium text-slate-600">{sublabel}</p>
        </div>
      </div>

      <div className="p-3.5">
        {entries.length === 0 ? (
          <p className="py-4 text-center text-xs italic text-slate-400">No medicines scheduled</p>
        ) : (
          <ul className="space-y-2.5">
            {entries.map((entry, idx) => (
              <li
                key={`${entry.medication_name}-${idx}`}
                className={`rounded-xl border p-3 text-sm transition ${
                  entry.ocr_confidence !== 'high'
                    ? 'border-amber-400 bg-amber-50/40 ring-1 ring-amber-300'
                    : 'border-slate-100 bg-slate-50/70 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-slate-900">{entry.medication_name}</span>
                  <span className="rounded-md bg-teal-100 px-2 py-0.5 text-xs font-bold text-teal-900">
                    {entry.dosage}
                  </span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{entry.instructions}</p>
                {entry.with_food !== null && entry.with_food !== undefined && (
                  <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-teal-800 ring-1 ring-teal-200">
                    <Utensils className="h-3 w-3" />
                    {entry.with_food ? 'Take with food' : 'Empty stomach'}
                  </div>
                )}
                {entry.ocr_confidence !== 'high' && (
                  <div className="mt-2 text-[11px] font-bold text-amber-800">
                    ⚠ Unclear handwriting — confirm with pharmacist
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
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
            headerBg={slot.headerBg}
            iconColor={slot.iconColor}
            cardBorder={slot.cardBorder}
            entries={schedule[slot.key]}
          />
        ))}
      </div>

      {schedule.as_needed.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-teal-200 bg-white shadow-sm print-break-inside-avoid">
          <div className="flex items-center gap-2 border-b border-teal-100 bg-teal-50/70 px-4 py-3">
            <Clock className="h-4 w-4 text-teal-700" />
            <h4 className="text-sm font-bold text-teal-950">As Needed (PRN)</h4>
          </div>
          <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2">
            {schedule.as_needed.map((entry, idx) => (
              <div key={`${entry.medication_name}-prn-${idx}`} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{entry.medication_name}</span>
                  <span className="rounded-md bg-teal-100 px-2 py-0.5 text-xs font-bold text-teal-900">
                    {entry.dosage}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">{entry.instructions}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
