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
      className={`rounded-xl border bg-white p-4 shadow-xs print-break-inside-avoid ${
        isUncertain ? 'border-amber-400 ring-2 ring-amber-200/70' : 'border-slate-200'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
            <Pill className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-base font-bold text-slate-900">
              {fda_citation.normalized_name || extracted.raw_name}
            </h4>
            <p className="text-xs text-slate-500">
              {extracted.dosage} • {extracted.frequency} • {extracted.route}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {fda_citation.rxcui && (
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-mono font-medium text-slate-700">
              RxCUI: {fda_citation.rxcui}
            </span>
          )}
          {fda_citation.verified_via === 'rxnorm_openfda' ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
              <CheckCircle2 className="h-3 w-3" />
              FDA Label Verified
            </span>
          ) : fda_citation.verified_via === 'rxnorm_only' ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2.5 py-0.5 text-[11px] font-semibold text-sky-800">
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
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
          <div>
            <span className="font-bold uppercase tracking-wide">
              {extracted.ocr_confidence} OCR Confidence — Verify Before Taking:
            </span>{' '}
            {extracted.uncertainty_reason || 'Part of this prescription was unclear. Confirm the exact dose with your pharmacy.'}
          </div>
        </div>
      )}

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Why you take this
          </p>
          <p className="mt-1 text-sm text-slate-800">{extracted.plain_purpose}</p>
        </div>
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            How to take it
          </p>
          <p className="mt-1 text-sm text-slate-800">{extracted.plain_instructions}</p>
        </div>
      </div>

      {(fda_citation.boxed_warning || fda_citation.key_warnings || fda_citation.fda_label_url) && (
        <div className="mt-3 border-t border-slate-100 pt-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setShowFdaDetails((prev) => !prev)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 no-print"
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
            <div className="mt-2.5 space-y-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-700 border border-slate-200">
              {fda_citation.boxed_warning && (
                <div className="rounded border border-rose-200 bg-rose-50 p-2 text-rose-900">
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
  );
}
