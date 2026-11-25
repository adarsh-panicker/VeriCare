import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  FileText,
  Globe,
  HelpCircle,
  Loader2,
  MessageSquareHeart,
  Printer,
  Send,
  ShieldCheck,
  Sparkles,
  Upload,
} from 'lucide-react';
import { InteractionCard } from './components/InteractionCard';
import { MedicationCard } from './components/MedicationCard';
import { ScheduleBoard } from './components/ScheduleBoard';
import { VeriCareLogo } from './components/VeriCareLogo';
import type {
  AnalysisResponse,
  AskPharmacistResponse,
  SampleSummaryInfo,
} from './types';

const LANGUAGES = [
  'English',
  'Spanish',
  'Hindi',
  'Arabic',
  'French',
  'Mandarin Chinese',
];

export function App() {
  const [samples, setSamples] = useState<SampleSummaryInfo[]>([]);
  const [health, setHealth] = useState<{ gemini_configured: boolean } | null>(null);
  const [language, setLanguage] = useState('English');
  const [inputTab, setInputTab] = useState<'upload' | 'paste'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeStage, setActiveStage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResponse | null>(null);

  // Grounded Q&A state
  const [question, setQuestion] = useState('');
  const [asking, setAsking] = useState(false);
  const [qaReply, setQaReply] = useState<AskPharmacistResponse | null>(null);

  useEffect(() => {
    fetch('/api/samples')
      .then((r) => r.json())
      .then(setSamples)
      .catch(() => {});
    fetch('/api/health')
      .then((r) => r.json())
      .then(setHealth)
      .catch(() => {});
  }, []);

  const runAnalysis = async (opts: { sampleId?: string; file?: File; text?: string }) => {
    setLoading(true);
    setError(null);
    setQaReply(null);
    setActiveStage(1);

    const t1 = window.setTimeout(() => setActiveStage(2), 900);
    const t2 = window.setTimeout(() => setActiveStage(3), 1800);

    try {
      const form = new FormData();
      form.append('language', language);
      if (opts.sampleId) {
        form.append('sample_id', opts.sampleId);
      } else if (opts.file) {
        form.append('file', opts.file);
      } else if (opts.text) {
        form.append('raw_text', opts.text);
      }

      const res = await fetch('/api/analyze', {
        method: 'POST',
        body: form,
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.detail || `Server error (${res.status})`);
      }

      const data: AnalysisResponse = await res.json();
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to analyze discharge summary.');
    } finally {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      setLoading(false);
      setActiveStage(0);
    }
  };

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!result || !question.trim()) return;
    setAsking(true);
    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question.trim(),
          language: result.language,
          context_summary: result.patient_friendly_summary,
          medications_json: JSON.stringify(result.medications),
        }),
      });
      const data: AskPharmacistResponse = await res.json();
      setQaReply(data);
    } catch {
      setQaReply({
        answer: 'Could not reach the server. Please ask your pharmacist directly.',
        disclaimer: result.medical_disclaimer,
      });
    } finally {
      setAsking(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-100 via-teal-50 to-emerald-50 text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-teal-700/40 bg-teal-900/95 text-white backdrop-blur no-print shadow-sm">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <VeriCareLogo className="h-11 w-11 shrink-0 drop-shadow-xs" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white">VeriCare</h1>
                <span className="rounded-full bg-teal-700/80 border border-teal-500/50 px-2.5 py-0.5 text-[11px] font-semibold text-teal-100">
                  By Adarsh Panicker
                </span>
              </div>
              <p className="text-xs text-teal-200">
                Clinical Discharge Translator &amp; FDA Interaction Auditor
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-950/50 px-3 py-1 text-xs font-medium text-emerald-200">
              <ShieldCheck className="h-3.5 w-3.5" />
              RxNorm + OpenFDA Live
            </span>
            {health && (
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${
                  health.gemini_configured
                    ? 'border-teal-400/40 bg-teal-950/50 text-teal-100'
                    : 'border-amber-300/40 bg-amber-950/50 text-amber-200'
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                {health.gemini_configured ? 'Gemini Multimodal Ready' : 'Demo Mode (Add GEMINI_API_KEY for Uploads)'}
              </span>
            )}

            <div className="flex items-center gap-1.5 rounded-lg border border-teal-600 bg-teal-800/90 px-2.5 py-1.5">
              <Globe className="h-4 w-4 text-teal-200" />
              <select
                aria-label="Target patient language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-teal-800 text-xs font-semibold text-white focus:outline-none"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>

            {result && (
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-teal-900 hover:bg-teal-50"
              >
                <Printer className="h-3.5 w-3.5" />
                Print Care Plan
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        {/* Responsible AI Banner */}
        <div className="flex items-start gap-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-xs sm:text-sm text-sky-950">
          <ShieldCheck className="h-5 w-5 shrink-0 text-sky-700 mt-0.5" />
          <div>
            <span className="font-bold">Responsible AI &amp; Safety Guardrail: </span>
            VeriCare translates hospital jargon into 6th-grade plain language and cross-checks prescriptions
            against official NLM RxNorm &amp; OpenFDA drug labels. It is <strong>not medical advice</strong> — always
            confirm doses and flagged interactions with your doctor or pharmacist.
          </div>
        </div>

        {/* Input / Demo Selector */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs no-print">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left: Upload or Paste */}
            <div className="lg:col-span-6 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900">1. Upload Discharge Paper or Rx</h2>
                <div className="flex rounded-lg bg-slate-100 p-0.5 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setInputTab('upload')}
                    className={`rounded-md px-2.5 py-1 ${
                      inputTab === 'upload' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Photo / PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputTab('paste')}
                    className={`rounded-md px-2.5 py-1 ${
                      inputTab === 'paste' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Paste Text
                  </button>
                </div>
              </div>

              {inputTab === 'upload' ? (
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/70 p-6 text-center transition hover:border-teal-500 hover:bg-teal-50/30">
                  <Upload className="h-8 w-8 text-teal-600" />
                  <p className="mt-2 text-sm font-semibold text-slate-800">
                    {selectedFile ? selectedFile.name : 'Click to upload discharge PDF, photo, or text'}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Supports PNG, JPG, PDF, or TXT • Multimodal OCR + Confidence Scoring
                  </p>
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.webp,.txt"
                    className="hidden"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  />
                </label>
              ) : (
                <textarea
                  rows={5}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="Paste hospital discharge summary or medication list here..."
                  className="w-full rounded-xl border border-slate-300 p-3 text-sm focus:border-teal-500 focus:outline-none"
                />
              )}

              <button
                type="button"
                disabled={
                  loading ||
                  (inputTab === 'upload' ? !selectedFile : !rawText.trim())
                }
                onClick={() =>
                  runAnalysis(
                    inputTab === 'upload'
                      ? { file: selectedFile || undefined }
                      : { text: rawText }
                  )
                }
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Translate &amp; Audit with FDA Labels
              </button>
            </div>

            {/* Right: 1-Click Samples */}
            <div className="lg:col-span-6 space-y-3">
              <h2 className="text-base font-bold text-slate-900">
                Or Try a 1-Click Clinical Demo
              </h2>
              <div className="space-y-2.5">
                {samples.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    disabled={loading}
                    onClick={() => runAnalysis({ sampleId: s.id })}
                    className="flex w-full items-start justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 text-left transition hover:border-teal-500 hover:bg-teal-50/40 disabled:opacity-50"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">{s.title}</span>
                        <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-bold text-teal-800">
                          {s.highlight_badge}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-600">{s.subtitle}</p>
                    </div>
                    <FileText className="h-5 w-5 shrink-0 text-teal-700 mt-0.5" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Pipeline Progress */}
          {loading && (
            <div className="mt-5 grid grid-cols-1 gap-2 rounded-xl border border-teal-200 bg-teal-50/60 p-3 sm:grid-cols-3">
              {[
                '1. Multimodal OCR & Extraction',
                '2. RxNorm & OpenFDA Verification',
                '3. 6th-Grade Plan & Daily Schedule',
              ].map((stepLabel, idx) => {
                const stepNum = idx + 1;
                const active = activeStage === stepNum;
                const done = activeStage > stepNum;
                return (
                  <div
                    key={stepLabel}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold ${
                      active
                        ? 'bg-teal-600 text-white'
                        : done
                          ? 'bg-emerald-100 text-emerald-900'
                          : 'bg-white/70 text-slate-500'
                    }`}
                  >
                    {active ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : done ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-slate-300" />
                    )}
                    {stepLabel}
                  </div>
                );
              })}
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-xl border border-rose-300 bg-rose-50 p-3 text-sm text-rose-900">
              <strong>Error:</strong> {error}
            </div>
          )}
        </section>

        {/* Results Dashboard */}
        {result && (
          <div className="space-y-6">
            {/* Document Warnings / Low OCR Confidence */}
            {(result.overall_ocr_confidence !== 'high' || result.document_warnings.length > 0) && (
              <div className="rounded-xl border-2 border-amber-400 bg-amber-50 p-4">
                <div className="flex items-center gap-2 font-bold text-amber-950">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  Uncertainty &amp; Handwriting Review Required ({result.overall_ocr_confidence.toUpperCase()} Confidence)
                </div>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-900">
                  {result.document_warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Plain-Language Summary */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
                    {result.reading_level_target} • {result.language}
                  </span>
                  <h2 className="text-xl font-bold text-slate-900">{result.primary_diagnosis}</h2>
                </div>
                {result.discharge_date && (
                  <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                    Discharge Date: {result.discharge_date}
                  </span>
                )}
              </div>
              <p className="mt-3 text-base leading-relaxed text-slate-800">
                {result.patient_friendly_summary}
              </p>
            </section>

            {/* Deterministic Drug Interactions */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">
                  FDA Drug Interaction Audit ({result.interactions.length})
                </h3>
                <span className="text-xs font-medium text-slate-500">
                  Checked deterministically against OpenFDA &amp; clinical rules
                </span>
              </div>
              {result.interactions.length === 0 ? (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-900">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  No high-priority pairwise drug interactions detected in your medication list.
                </div>
              ) : (
                <div className="space-y-3">
                  {result.interactions.map((alert) => (
                    <InteractionCard key={alert.id} alert={alert} />
                  ))}
                </div>
              )}
            </section>

            {/* Daily Medication Schedule */}
            <section className="space-y-3">
              <h3 className="text-lg font-bold text-slate-900">Your Daily Medication Schedule</h3>
              <ScheduleBoard schedule={result.daily_schedule} />
            </section>

            {/* Verified Medication Cards */}
            <section className="space-y-3">
              <h3 className="text-lg font-bold text-slate-900">
                Your Medicines Explained ({result.medications.length})
              </h3>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {result.medications.map((med, idx) => (
                  <MedicationCard key={`${med.extracted.raw_name}-${idx}`} med={med} />
                ))}
              </div>
            </section>

            {/* Red Flags & Follow-up */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <section className="rounded-2xl border border-rose-200 bg-white p-5 shadow-xs print-break-inside-avoid">
                <h3 className="flex items-center gap-2 text-lg font-bold text-rose-900">
                  <AlertTriangle className="h-5 w-5 text-rose-600" />
                  Red-Flag Symptoms (When to Get Help)
                </h3>
                <div className="mt-3 space-y-2.5">
                  {result.red_flags.map((rf, i) => (
                    <div
                      key={i}
                      className={`rounded-xl border p-3 text-sm ${
                        rf.urgency === 'call_911'
                          ? 'border-rose-300 bg-rose-50'
                          : 'border-amber-200 bg-amber-50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-slate-900">{rf.symptom}</span>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                            rf.urgency === 'call_911'
                              ? 'bg-rose-600 text-white'
                              : 'bg-amber-500 text-slate-950'
                          }`}
                        >
                          {rf.urgency === 'call_911' ? 'Call 911 / ER' : 'Call Doctor'}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-700">{rf.action}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs print-break-inside-avoid">
                <div>
                  <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                    <CalendarCheck className="h-5 w-5 text-teal-600" />
                    Follow-Up Checklist
                  </h3>
                  <ul className="mt-2.5 space-y-2">
                    {result.follow_up_instructions.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                        <ClipboardList className="h-4 w-4 shrink-0 text-teal-600 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="border-t border-slate-100 pt-4">
                  <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
                    <HelpCircle className="h-5 w-5 text-teal-600" />
                    Questions to Ask Your Pharmacist
                  </h3>
                  <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-slate-700">
                    {result.questions_for_pharmacist.map((q, i) => (
                      <li key={i}>{q}</li>
                    ))}
                  </ul>
                </div>
              </section>
            </div>

            {/* Grounded Q&A */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs no-print">
              <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
                <MessageSquareHeart className="h-5 w-5 text-teal-600" />
                Ask About Your Discharge Plan
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Answers are strictly grounded in your extracted discharge summary and FDA labels.
              </p>
              <form onSubmit={handleAsk} className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="e.g., Can I take ibuprofen for a headache with these medicines?"
                  className="flex-1 rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-teal-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={asking || !question.trim()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
                >
                  {asking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Ask
                </button>
              </form>
              {qaReply && (
                <div className="mt-3 rounded-xl border border-teal-200 bg-teal-50/50 p-4 text-sm text-slate-800">
                  <p className="leading-relaxed">{qaReply.answer}</p>
                  <p className="mt-2 text-xs italic text-slate-500">{qaReply.disclaimer}</p>
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      <footer className="border-t border-teal-200/80 bg-teal-900/5 py-4 text-center text-xs text-teal-900/80">
        VeriCare — Built for SLAY HACKS 2026 <span className="font-semibold">By Adarsh Panicker</span>
      </footer>
    </div>
  );
}

export default App;
