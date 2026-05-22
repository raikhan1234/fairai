import { useTranslation } from 'react-i18next'
import { useApp } from './store'
import LandingPage from './components/LandingPage'
import Sidebar from './components/Sidebar'
import UploadPanel from './components/UploadPanel'
import DatasetPreview from './components/DatasetPreview'
import ConfigPanel from './components/ConfigPanel'
import MetricCard from './components/MetricCard'
import PerformanceChart from './components/PerformanceChart'
import FairnessChart from './components/FairnessChart'
import TradeoffChart from './components/TradeoffChart'
import GroupTable from './components/GroupTable'
import RecommendationCard from './components/RecommendationCard'
import FairnessTable from './components/FairnessTable'
import type { MLAnalysisResponse, LLMAnalysisResponse, PredictionsAnalysisResponse } from './types'

// ── Step progress bar ──────────────────────────────────────────────────────────

function StepBar() {
  const { t } = useTranslation()
  const { state } = useApp()
  const steps = [
    { key: 'upload', label: t('step_upload') },
    { key: 'configure', label: t('step_configure') },
    { key: 'results', label: t('step_results') },
  ]
  const idx = steps.findIndex(s => s.key === state.step)

  return (
    <div className="flex items-center gap-0">
      {steps.map((s, i) => (
        <div key={s.key} className="flex items-center">
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
              style={
                i < idx
                  ? { background: 'linear-gradient(135deg,#06B6D4,#8B5CF6)', color: 'white' }
                  : i === idx
                  ? { background: 'rgba(6,182,212,0.15)', border: '1px solid #06B6D4', color: '#06B6D4' }
                  : { background: 'var(--color-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }
              }
            >
              {i < idx ? '✓' : i + 1}
            </div>
            <span
              className="text-xs font-medium hidden sm:block"
              style={{ color: i === idx ? 'var(--color-text)' : i < idx ? '#06B6D4' : 'var(--color-text-muted)' }}
            >
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className="w-8 h-px mx-2 sm:w-12" style={{ background: i < idx ? 'rgba(6,182,212,0.5)' : 'var(--color-border)' }} />
          )}
        </div>
      ))}
    </div>
  )
}

// ── Results ────────────────────────────────────────────────────────────────────

function MLResults({ data }: { data: MLAnalysisResponse }) {
  const { t } = useTranslation()
  const best = data.results.find(r => r.model === data.best_model) ?? data.results[0]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label={t('metric_accuracy')}
          value={`${(best.performance.accuracy * 100).toFixed(1)}%`}
          sub={`${t('results_best')}: ${data.best_display_name}`}
          accent="cyan"
        />
        <MetricCard
          label={t('metric_f1')}
          value={best.performance.f1}
          sub={`${t('metric_precision')}: ${best.performance.precision.toFixed(3)} · ${t('metric_recall')}: ${best.performance.recall.toFixed(3)}`}
          accent="violet"
        />
        <MetricCard
          label={t('metric_dp')}
          value={best.fairness.dp_diff}
          sub={`${t('metric_eo')}: ${best.fairness.eo_diff.toFixed(3)}`}
          accent={best.fairness.dp_diff < 0.02 ? 'green' : best.fairness.dp_diff < 0.05 ? 'amber' : 'red'}
        />
        <MetricCard
          label={t('metric_eodds')}
          value={best.fairness.eodds_diff}
          sub={t(`bias_${best.bias_level}`)}
          accent={best.bias_level === 'low' ? 'green' : best.bias_level === 'moderate' ? 'amber' : 'red'}
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <PerformanceChart results={data.results} />
        <FairnessChart results={data.results} />
      </div>
      <FairnessTable results={data.results} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <TradeoffChart data={data.tradeoff_data} />
        <GroupTable results={data.results} />
      </div>
      <RecommendationCard bestModel={data.best_model} results={data.results} />
    </div>
  )
}

function PredResults({ data }: { data: PredictionsAnalysisResponse }) {
  const { t } = useTranslation()
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label={t('metric_accuracy')} value={`${(data.performance.accuracy * 100).toFixed(1)}%`} accent="cyan" />
        <MetricCard label={t('metric_f1')} value={data.performance.f1} accent="violet" />
        <MetricCard label={t('metric_dp')} value={data.fairness.dp_diff}
          accent={data.fairness.dp_diff < 0.02 ? 'green' : data.fairness.dp_diff < 0.05 ? 'amber' : 'red'} />
        <MetricCard label={t('metric_eo')} value={data.fairness.eo_diff}
          accent={data.bias_level === 'low' ? 'green' : data.bias_level === 'moderate' ? 'amber' : 'red'} />
      </div>
      <FairnessTable results={[data]} />
      <GroupTable results={[data]} />
      <RecommendationCard bestModel={data.model} results={[data]} />
    </div>
  )
}

function LLMResults({ data }: { data: LLMAnalysisResponse }) {
  const { t } = useTranslation()
  const best = data.results.find(r => r.model === data.best_model) ?? data.results[0]
  if (!best) return null

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label={t('metric_accuracy')} value={`${(best.performance.accuracy * 100).toFixed(1)}%`}
          sub={`${t('results_best')}: ${data.best_display_name}`} accent="cyan" />
        <MetricCard label={t('metric_f1')} value={best.performance.f1} accent="violet" />
        <MetricCard label={t('metric_dp')} value={best.fairness.dp_diff}
          accent={best.fairness.dp_diff < 0.02 ? 'green' : best.fairness.dp_diff < 0.05 ? 'amber' : 'red'} />
        <MetricCard label={t('metric_eodds')} value={best.fairness.eodds_diff}
          accent={best.bias_level === 'low' ? 'green' : best.bias_level === 'moderate' ? 'amber' : 'red'} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <PerformanceChart results={data.results} />
        <FairnessChart results={data.results} />
      </div>
      <FairnessTable results={data.results} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <TradeoffChart data={data.tradeoff_data} />
        <GroupTable results={data.results} />
      </div>
      <RecommendationCard bestModel={data.best_model ?? ''} results={data.results} />
    </div>
  )
}

// ── Main App ───────────────────────────────────────────────────────────────────

export default function App() {
  const { t } = useTranslation()
  const { state, dispatch } = useApp()

  // Lobby is full-screen, no sidebar
  if (state.step === 'lobby') {
    return <LandingPage />
  }

  const renderContent = () => {
    if (state.step === 'upload') return <UploadPanel />

    if (state.step === 'configure') {
      return (
        <div className="space-y-6">
          <DatasetPreview />
          <ConfigPanel />
        </div>
      )
    }

    if (state.step === 'results') {
      return (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <button onClick={() => dispatch({ type: 'SET_STEP', step: 'configure' })} className="v1-btn-ghost text-xs">
              ← {t('results_back')}
            </button>
            <button onClick={() => dispatch({ type: 'RESET' })} className="v1-btn-ghost text-xs">
              ↺ {t('results_back')}
            </button>
          </div>
          {state.mode === 'ml' && state.mlResult && <MLResults data={state.mlResult} />}
          {state.mode === 'predictions' && state.predResult && <PredResults data={state.predResult} />}
          {state.mode === 'llm' && state.llmResult && <LLMResults data={state.llmResult} />}
        </div>
      )
    }
  }

  const pageTitle = () => {
    if (state.step === 'upload') return t('upload_title')
    if (state.step === 'configure') return t('config_title')
    return t('results_title')
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: 'var(--color-bg)' }}>
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header
          className="flex-shrink-0 flex items-center justify-between px-6 py-3.5"
          style={{ backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}
        >
          <div>
            <h1 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{pageTitle()}</h1>
            {state.upload && (
              <p className="text-[11px] text-text-muted mt-0.5">
                {state.upload.filename} · {state.upload.rows.toLocaleString()} {t('preview_rows')} · {state.upload.columns.length} {t('preview_cols')}
              </p>
            )}
          </div>
          <StepBar />
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto px-6 py-6">
          {renderContent()}
        </main>
      </div>
    </div>
  )
}
