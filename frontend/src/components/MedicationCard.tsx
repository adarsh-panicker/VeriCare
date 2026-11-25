import { useState } from 'react';
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, ExternalLink, Pill } from 'lucide-react';
import type { VerifiedMedication } from '../types';

interface Props {
  med: VerifiedMedication;
}

export function MedicationCard({ med }: Props) {
  const [showFdaDetails, setShowFdaDetails] = useState(false);
  const { extracted, fda_citation } = med;
  const isUncertain = extracted.ocr_confidence !== 'high';

  return (
    <div
      className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition-all hover:shadow-md print-break-inside-avoid ${
        isUncertain ? 'border-amber-400 ring-2 ring-amber-200/80' : 'border-teal-200/70'
      }`}
    >
      <div
        className={`h-1.5 w-full ${
          isUncertain
            ? 'bg-gradient-to-r from-amber-400 to-orange-400'
            : 'bg-gradient-to-r from-teal-500 to-emerald-500'
        }`}
      />
      <div className="p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                isUncertain ? 'bg-amber-100 text-amber-700' : 'bg-teal-50 text-teal-700 ring-1 ring-teal-200'
              }`}
            >
              <Pill className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900">
                {fda_citation.normalized_name || extracted.raw_name}
              </h4>
              <p className="text-xs font-medium text-slate-500">
                {extracted.dosage} • {extracted.frequency} • {extracted.route}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {fda_citation.rxcui && (
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-mono font-semibold text-slate-700">
                RxCUI: {fda_citation.rxcui}
              </span>
            )}
            {fda_citation.verified_via === 'rxnorm_openfda' ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                <CheckCircle2 className="h-3 w-3" />
                FDA Label Verified
              </span>
            ) : fda_citation.verified_via === 'rxnorm_only' ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2.5 py-0.5 text-[11px] font-bold text-sky-800">
                RxNorm Verified
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
                Unverified Name
              </span>
            )}
          </div>
        </div>

        {isUncertain && (
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <div>
              <span className="font-bold uppercase tracking-wide">
                {extracted.ocr_confidence} OCR Confidence — Verify Before Taking:
              </span>{' '}
              {extracted.uncertainty_reason || 'Part of this prescription was unclear. Confirm the exact dose with your pharmacy.'}
            </div>
          </div>
        )}

        <div className="mt-3.5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-teal-100 bg-teal-50/50 p-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-teal-800">
              Why you take this
            </p>
            <p className="mt-1 text-sm leading-relaxed text-slate-800">{extracted.plain_purpose}</p>
          </div>
          <div className="rounded-xl border border-sky-100 bg-sky-50/50 p-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-sky-800">
              How to take it
            </p>
            <p className="mt-1 text-sm leading-relaxed text-slate-800">{extracted.plain_instructions}</p>
          </div>
        </div>

        {(fda_citation.boxed_warning || fda_citation.key_warnings || fda_citation.fda_label_url) && (
          <div className="mt-3.5 border-t border-slate-100 pt-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setShowFdaDetails((prev) => !prev)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-teal-800 no-print"
              >
                {showFdaDetails ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                {showFdaDetails ? 'Hide Official FDA Label Excerpts' : 'Inspect Official FDA Label Excerpts'}
              </button>
              {fda_citation.fda_label_url && (
                <a
                  href={fda_citation.fda_label_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-900 underline"
                >
                  DailyMed FDA Label
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>

            {showFdaDetails && (
              <div className="mt-2.5 space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                {fda_citation.boxed_warning && (
                  <div className="rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-rose-900">
                    <span className="font-bold">FDA Boxed Warning: </span>
                    {fda_citation.boxed_warning}
                  </div>
                )}
                {fda_citation.key_warnings && (
                  <div>
                    <span className="font-semibold text-slate-900">Warnings &amp; Precautions: </span>
                    {fda_citation.key_warnings}
                  </div>
                )}
                {fda_citation.drug_interactions_excerpt && (
                  <div>
                    <span className="font-semibold text-slate-900">Label Drug Interactions: </span>
                    {fda_citation.drug_interactions_excerpt}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
