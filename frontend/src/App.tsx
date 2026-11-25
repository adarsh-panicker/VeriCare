import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  BookOpenCheck,
  CalendarCheck,
  Check,
  CheckCircle2,
  Copy,
  FileText,
  Globe,
  HelpCircle,
  KeyRound,
  Loader2,
  Lock,
  MessageSquareHeart,
  Pill,
  Printer,
  Send,
  ShieldAlert,
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
  const [checkedFollowUps, setCheckedFollowUps] = useState<Record<number, boolean>>({});
  const [copiedQuestions, setCopiedQuestions] = useState(false);

  // Secure Gemini Key Modal state (never stored in browser storage)
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [savingKey, setSavingKey] = useState(false);
  const [keyError, setKeyError] = useState<string | null>(null);

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
    setCheckedFollowUps({});
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

  const handleCopyQuestions = async () => {
    if (!result) return;
    const text = result.questions_for_pharmacist.map((q, idx) => `${idx + 1}. ${q}`).join('\n');
    await navigator.clipboard.writeText(text).catch(() => {});
    setCopiedQuestions(true);
    window.setTimeout(() => setCopiedQuestions(false), 2000);
  };

  const handleSaveApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKeyInput.trim()) return;
    setSavingKey(true);
    setKeyError(null);
    try {
      const res = await fetch('/api/config/gemini-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: apiKeyInput.trim() }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.detail || 'Failed to save API key');
      }
      const data = await res.json();
      setHealth((prev) => ({ ...(prev || {}), gemini_configured: !!data.gemini_configured }));
      setApiKeyInput('');
      setShowKeyModal(false);
    } catch (err) {
      setKeyError(err instanceof Error ? err.message : 'Could not save API key');
    } finally {
      setSavingKey(false);
    }
  };

  const totalScheduledDoses = result
    ? result.daily_schedule.morning.length +
      result.daily_schedule.midday.length +
      result.daily_schedule.evening.length +
      result.daily_schedule.bedtime.length +
      result.daily_schedule.as_needed.length
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-100 via-teal-50 to-emerald-50 text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-teal-700/40 bg-teal-900/95 text-white shadow-md backdrop-blur no-print">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <VeriCareLogo className="h-11 w-11 shrink-0 drop-shadow-sm" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-extrabold tracking-tight text-white">VeriCare</h1>
                <span className="rounded-full border border-teal-400/40 bg-teal-700/80 px-2.5 py-0.5 text-[11px] font-semibold text-teal-100">
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
              <button
                type="button"
                onClick={() => {
                  setKeyError(null);
                  setApiKeyInput('');
                  setShowKeyModal(true);
                }}
                title="Configure Gemini API key on server"
                className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition hover:opacity-90 ${
                  health.gemini_configured
                    ? 'border-teal-400/40 bg-teal-950/50 text-teal-100'
                    : 'border-amber-300/50 bg-amber-950/60 text-amber-200 hover:bg-amber-900/70'
                }`}
              >
                <KeyRound className="h-3.5 w-3.5" />
                {health.gemini_configured
                  ? 'Gemini Multimodal Ready (Update Key)'
                  : 'Demo Mode (Click to Add GEMINI_API_KEY)'}
              </button>
            )}

            <div className="flex items-center gap-1.5 rounded-xl border border-teal-500/60 bg-teal-800/90 px-3 py-1.5 shadow-xs">
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
                className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-1.5 text-xs font-bold text-teal-900 shadow-xs transition hover:bg-teal-50"
              >
                <Printer className="h-3.5 w-3.5" />
                Print Care Plan
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        {/* Hero Banner */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-teal-800 via-teal-700 to-emerald-700 p-6 text-white shadow-md no-print">
          <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl space-y-1.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-teal-100 backdrop-blur">
                <Sparkles className="h-3.5 w-3.5" />
                Clear, Verified Post-Hospital Care
              </span>
              <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                Understand every prescription before you take the first dose.
              </h2>
              <p className="text-sm text-teal-100/90">
                Upload a hospital discharge paper or try a clinical sample to get a 6th-grade action plan,
                daily pill schedule, and deterministic OpenFDA interaction audit.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-xl bg-white/10 p-3 backdrop-blur">
                <p className="font-bold text-teal-200">Step 1</p>
                <p className="mt-0.5 font-medium text-white">Extract Rx</p>
              </div>
              <div className="rounded-xl bg-white/10 p-3 backdrop-blur">
                <p className="font-bold text-teal-200">Step 2</p>
                <p className="mt-0.5 font-medium text-white">FDA Audit</p>
              </div>
              <div className="rounded-xl bg-white/10 p-3 backdrop-blur">
                <p className="font-bold text-teal-200">Step 3</p>
                <p className="mt-0.5 font-medium text-white">Care Plan</p>
              </div>
            </div>
          </div>
        </section>

        {/* Responsible AI Banner */}
        <div className="flex items-start gap-3 rounded-2xl border border-teal-200 bg-white/90 px-4 py-3.5 text-xs sm:text-sm text-slate-800 shadow-xs">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-100 text-teal-700">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <span className="font-bold text-teal-950">Responsible AI &amp; Safety Guardrail: </span>
            VeriCare translates hospital jargon into 6th-grade plain language and cross-checks prescriptions
            against official NLM RxNorm &amp; OpenFDA drug labels. It is <strong>not medical advice</strong> — always
            confirm doses and flagged interactions with your doctor or pharmacist.
          </div>
        </div>

        {/* Input / Demo Selector */}
        <section className="rounded-2xl border border-teal-200/80 bg-white p-5 sm:p-6 shadow-sm no-print">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left: Upload or Paste */}
            <div className="lg:col-span-6 space-y-3.5">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900">1. Upload Discharge Paper or Rx</h2>
                <div className="flex rounded-xl bg-teal-50 p-1 text-xs font-semibold ring-1 ring-teal-200/70">
                  <button
                    type="button"
                    onClick={() => setInputTab('upload')}
                    className={`rounded-lg px-3 py-1 transition ${
                      inputTab === 'upload' ? 'bg-teal-700 text-white shadow-xs' : 'text-teal-800 hover:bg-teal-100'
                    }`}
                  >
                    Photo / PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputTab('paste')}
                    className={`rounded-lg px-3 py-1 transition ${
                      inputTab === 'paste' ? 'bg-teal-700 text-white shadow-xs' : 'text-teal-800 hover:bg-teal-100'
                    }`}
                  >
                    Paste Text
                  </button>
                </div>
              </div>

              {inputTab === 'upload' ? (
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-teal-300 bg-teal-50/40 p-7 text-center transition hover:border-teal-500 hover:bg-teal-50">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-100 text-teal-700">
                    <Upload className="h-6 w-6" />
                  </div>
                  <p className="mt-3 text-sm font-bold text-slate-800">
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
                  className="w-full rounded-2xl border border-teal-200 bg-teal-50/20 p-3.5 text-sm focus:border-teal-500 focus:bg-white focus:outline-none"
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
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:from-teal-700 hover:to-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Translate &amp; Audit with FDA Labels
              </button>
            </div>

            {/* Right: 1-Click Samples */}
            <div className="lg:col-span-6 space-y-3.5">
              <h2 className="text-base font-bold text-slate-900">
                2. Or Try a 1-Click Clinical Demo
              </h2>
              <div className="space-y-2.5">
                {samples.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    disabled={loading}
                    onClick={() => runAnalysis({ sampleId: s.id })}
                    className="group flex w-full items-start justify-between gap-3 rounded-2xl border border-teal-200/80 bg-gradient-to-r from-teal-50/50 to-white p-4 text-left shadow-xs transition-all hover:-translate-y-0.5 hover:border-teal-500 hover:shadow-md disabled:opacity-50"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 group-hover:text-teal-800">
                          {s.title}
                        </span>
                        <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-[10px] font-bold text-teal-800">
                          {s.highlight_badge}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-600">{s.subtitle}</p>
                    </div>
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-teal-100/80 text-teal-700 transition group-hover:bg-teal-600 group-hover:text-white">
                      <FileText className="h-4 w-4" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Pipeline Progress */}
          {loading && (
            <div className="mt-5 grid grid-cols-1 gap-2.5 rounded-2xl border border-teal-200 bg-teal-50/80 p-3.5 sm:grid-cols-3">
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
                    className={`flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-bold transition ${
                      active
                        ? 'bg-teal-700 text-white shadow-xs'
                        : done
                          ? 'bg-emerald-100 text-emerald-900'
                          : 'bg-white/80 text-slate-500'
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
            <div className="mt-4 rounded-xl border border-rose-300 bg-rose-50 p-3.5 text-sm text-rose-900">
              <strong>Error:</strong> {error}
            </div>
          )}
        </section>

        {/* Results Dashboard */}
        {result && (
          <div className="space-y-6">
            {/* Quick-Glance Metrics Row */}
            <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border border-teal-200 bg-white p-4 shadow-xs">
                <div className="flex items-center gap-2 text-xs font-semibold text-teal-700">
                  <Pill className="h-4 w-4" />
                  Medicines Audited
                </div>
                <p className="mt-1 text-2xl font-extrabold text-slate-900">{result.medications.length}</p>
              </div>
              <div
                className={`rounded-2xl border p-4 shadow-xs ${
                  result.interactions.length > 0
                    ? 'border-rose-200 bg-rose-50/70'
                    : 'border-emerald-200 bg-emerald-50/70'
                }`}
              >
                <div
                  className={`flex items-center gap-2 text-xs font-semibold ${
                    result.interactions.length > 0 ? 'text-rose-700' : 'text-emerald-700'
                  }`}
                >
                  <ShieldAlert className="h-4 w-4" />
                  Interaction Alerts
                </div>
                <p className="mt-1 text-2xl font-extrabold text-slate-900">{result.interactions.length}</p>
              </div>
              <div className="rounded-2xl border border-sky-200 bg-white p-4 shadow-xs">
                <div className="flex items-center gap-2 text-xs font-semibold text-sky-700">
                  <CalendarCheck className="h-4 w-4" />
                  Daily Doses
                </div>
                <p className="mt-1 text-2xl font-extrabold text-slate-900">{totalScheduledDoses}</p>
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-white p-4 shadow-xs">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
                  <BookOpenCheck className="h-4 w-4" />
                  Reading Level
                </div>
                <p className="mt-1 text-lg font-extrabold text-slate-900">6th Grade</p>
              </div>
            </section>

            {/* Document Warnings / Low OCR Confidence */}
            {(result.overall_ocr_confidence !== 'high' || result.document_warnings.length > 0) && (
              <div className="rounded-2xl border-2 border-amber-400 bg-amber-50 p-4 shadow-sm">
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
            <section className="rounded-2xl border border-teal-200 bg-white p-5 sm:p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="inline-block rounded-full bg-teal-100 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-teal-800">
                    {result.reading_level_target} • {result.language}
                  </span>
                  <h2 className="mt-1.5 text-xl font-extrabold text-slate-900">
                    {result.primary_diagnosis}
                  </h2>
                </div>
                {result.discharge_date && (
                  <span className="rounded-xl bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-800 ring-1 ring-teal-200">
                    Discharge Date: {result.discharge_date}
                  </span>
                )}
              </div>
              <p className="mt-3 text-base leading-relaxed text-slate-700">
                {result.patient_friendly_summary}
              </p>
            </section>

            {/* Deterministic Drug Interactions */}
            <section className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-lg font-extrabold text-slate-900">
                  FDA Drug Interaction Audit ({result.interactions.length})
                </h3>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-teal-800 ring-1 ring-teal-200">
                  Checked deterministically against OpenFDA &amp; clinical rules
                </span>
              </div>
              {result.interactions.length === 0 ? (
                <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-900 shadow-xs">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  No high-priority pairwise drug interactions detected in your medication list.
                </div>
              ) : (
                <div className="space-y-3.5">
                  {result.interactions.map((alert) => (
                    <InteractionCard key={alert.id} alert={alert} />
                  ))}
                </div>
              )}
            </section>

            {/* Daily Medication Schedule */}
            <section className="space-y-3">
              <h3 className="text-lg font-extrabold text-slate-900">Your Daily Medication Schedule</h3>
              <ScheduleBoard schedule={result.daily_schedule} />
            </section>

            {/* Verified Medication Cards */}
            <section className="space-y-3">
              <h3 className="text-lg font-extrabold text-slate-900">
                Your Medicines Explained ({result.medications.length})
              </h3>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {result.medications.map((med, idx) => (
                  <MedicationCard key={`${med.extracted.raw_name}-${idx}`} med={med} />
                ))}
              </div>
            </section>

            {/* Red Flags & Interactive Follow-up */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <section className="rounded-2xl border border-rose-200 bg-white p-5 shadow-sm print-break-inside-avoid">
                <h3 className="flex items-center gap-2 text-lg font-extrabold text-rose-900">
                  <AlertTriangle className="h-5 w-5 text-rose-600" />
                  Red-Flag Symptoms (When to Get Help)
                </h3>
                <div className="mt-3.5 space-y-2.5">
                  {result.red_flags.map((rf, i) => (
                    <div
                      key={i}
                      className={`rounded-xl border p-3.5 text-sm ${
                        rf.urgency === 'call_911'
                          ? 'border-rose-300 bg-rose-50/90'
                          : 'border-amber-200 bg-amber-50/90'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-slate-900">{rf.symptom}</span>
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                            rf.urgency === 'call_911'
                              ? 'bg-rose-600 text-white'
                              : 'bg-amber-500 text-slate-950'
                          }`}
                        >
                          {rf.urgency === 'call_911' ? 'Call 911 / ER' : 'Call Doctor'}
                        </span>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-slate-700">{rf.action}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="space-y-5 rounded-2xl border border-teal-200 bg-white p-5 shadow-sm print-break-inside-avoid">
                <div>
                  <h3 className="flex items-center gap-2 text-lg font-extrabold text-slate-900">
                    <CalendarCheck className="h-5 w-5 text-teal-600" />
                    Interactive Follow-Up Checklist
                  </h3>
                  <ul className="mt-3 space-y-2">
                    {result.follow_up_instructions.map((item, i) => {
                      const checked = !!checkedFollowUps[i];
                      return (
                        <li key={i}>
                          <button
                            type="button"
                            onClick={() =>
                              setCheckedFollowUps((prev) => ({ ...prev, [i]: !prev[i] }))
                            }
                            className={`flex w-full items-start gap-2.5 rounded-xl border p-2.5 text-left text-sm transition ${
                              checked
                                ? 'border-emerald-200 bg-emerald-50/60 text-slate-500 line-through'
                                : 'border-slate-200 bg-slate-50/60 text-slate-800 hover:border-teal-300'
                            }`}
                          >
                            <span
                              className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                                checked
                                  ? 'border-emerald-600 bg-emerald-600 text-white'
                                  : 'border-slate-400 bg-white'
                              }`}
                            >
                              {checked && <Check className="h-3 w-3" />}
                            </span>
                            <span>{item}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <div className="border-t border-slate-100 pt-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="flex items-center gap-2 text-base font-extrabold text-slate-900">
                      <HelpCircle className="h-5 w-5 text-teal-600" />
                      Questions to Ask Your Pharmacist
                    </h3>
                    <button
                      type="button"
                      onClick={handleCopyQuestions}
                      className="inline-flex items-center gap-1 rounded-lg bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-800 ring-1 ring-teal-200 hover:bg-teal-100 no-print"
                    >
                      {copiedQuestions ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      {copiedQuestions ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <ul className="mt-2.5 list-disc space-y-1.5 pl-5 text-sm text-slate-700">
                    {result.questions_for_pharmacist.map((q, i) => (
                      <li key={i}>{q}</li>
                    ))}
                  </ul>
                </div>
              </section>
            </div>

            {/* Grounded Q&A */}
            <section className="rounded-2xl border border-teal-200 bg-white p-5 shadow-sm no-print">
              <h3 className="flex items-center gap-2 text-base font-extrabold text-slate-900">
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
                  className="flex-1 rounded-xl border border-teal-200 bg-teal-50/20 px-3.5 py-2.5 text-sm focus:border-teal-500 focus:bg-white focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={asking || !question.trim()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-bold text-white shadow-xs transition hover:bg-teal-700 disabled:opacity-50"
                >
                  {asking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Ask
                </button>
              </form>
              {qaReply && (
                <div className="mt-3 rounded-xl border border-teal-200 bg-teal-50/60 p-4 text-sm text-slate-800">
                  <p className="leading-relaxed">{qaReply.answer}</p>
                  <p className="mt-2 text-xs italic text-slate-500">{qaReply.disclaimer}</p>
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      <footer className="mt-8 border-t border-teal-200/80 bg-teal-900/5 py-5 text-center text-xs text-teal-900/80">
        VeriCare — Built for SLAY HACKS 2026 <span className="font-bold">By Adarsh Panicker</span>
      </footer>

      {/* Secure Server-Side Gemini Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs no-print">
          <div className="w-full max-w-md rounded-2xl border border-teal-200 bg-white p-6 shadow-xl">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 text-teal-700">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Configure Gemini API Key
                </h3>
                <p className="text-xs text-slate-500">
                  Enables live PDF/photo uploads &amp; multilingual translation
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveApiKey} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Gemini API Key (masked)
                </label>
                <input
                  type="password"
                  autoComplete="off"
                  required
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="••••••••••••••••••••••••••••"
                  className="mt-1 w-full rounded-xl border border-teal-200 bg-teal-50/30 px-3.5 py-2.5 text-sm focus:border-teal-500 focus:bg-white focus:outline-none"
                />
              </div>

              <p className="rounded-lg bg-slate-50 p-2.5 text-[11px] leading-relaxed text-slate-600">
                <strong>Privacy &amp; Security:</strong> Your key is sent directly to your local backend
                server and stored only on the server side. It is never saved in browser storage and
                never sent back to the frontend.
              </p>

              {keyError && (
                <p className="text-xs font-semibold text-rose-700">{keyError}</p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setApiKeyInput('');
                    setShowKeyModal(false);
                  }}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingKey || !apiKeyInput.trim()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white hover:bg-teal-700 disabled:opacity-50"
                >
                  {savingKey && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Save Key Securely
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
