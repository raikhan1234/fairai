import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useApp } from '../store'
import { analyzeML, analyzePredictions, analyzeLLM } from '../api'
import type { AnalysisMode, ColStat } from '../types'
import clsx from 'clsx'
import LoadingSpinner from './LoadingSpinner'

// ── Column classification helpers ─────────────────────────────────────────────

/**
 * True only when the column has exactly 2 unique values and ALL sample
 * values look like 0 / 1 (int, float, or bool string form).
 */
function isBinaryCol(col: string, stats: Record<string, ColStat>): boolean {
  const s = stats[col]
  if (!s || s.unique !== 2) return false
  const VALID = new Set(['0', '1', 'true', 'false', '0.0', '1.0'])
  return s.sample.every(v => VALID.has(v.toLowerCase().trim()))
}

/**
 * True if the column looks like an auto-generated row identifier
 * (name is "id", ends with "_id", or it has as many unique values as
 * the total number of rows).
 */
function isIDLike(col: string, stats: Record<string, ColStat>, totalRows: number): boolean {
  const n = col.toLowerCase()
  if (['id', 'index', 'unnamed: 0', 'row', 'rownum', 'row_id'].includes(n)) return true
  if (n.endsWith('_id') || n.startsWith('id_')) return true
  const s = stats[col]
  if (s && s.unique === totalRows && totalRows > 10) return true
  return false
}

/** Heuristic: does this column name suggest it's a ground-truth / target? */
function isLikelyTarget(col: string): boolean {
  const kw = ['label', 'target', 'true_label', 'y_true', 'y', 'class', 'outcome', 'ground', 'truth', 'actual']
  const n = col.toLowerCase()
  return kw.some(k => n === k || n.includes(k))
}

/** Heuristic: does this column name suggest a protected / demographic attribute? */
function isLikelyProtected(col: string): boolean {
  const kw = ['sex', 'gender', 'race', 'rac', 'ethnicity', 'nationality', 'group', 'protected', 'sensitive', 'age', 'disability', 'religion']
  const n = col.toLowerCase()
  return kw.some(k => n === k || n.includes(k))
}

/** Heuristic: does this column name suggest a model prediction output? */
function isLikelyPrediction(col: string): boolean {
  const kw = ['pred', 'predict', 'output', 'llm', 'flan', 'llama', 'gpt', 'bert', 'result', 'model', 'score', 'infer']
  const n = col.toLowerCase()
  return kw.some(k => n.includes(k))
}

// ── Sorted column lists ────────────────────────────────────────────────────────

/** Columns eligible to be the target: non-ID, non-protected-selected, sorted binary-first. */
function targetOptions(
  cols: string[],
  stats: Record<string, ColStat>,
  rows: number,
  excludeProtected: string,
): string[] {
  return cols
    .filter(c => !isIDLike(c, stats, rows) && c !== excludeProtected)
    .sort((a, b) => {
      const score = (c: string) =>
        (isBinaryCol(c, stats) ? 20 : 0) +
        (isLikelyTarget(c) ? 10 : 0) -
        (isLikelyPrediction(c) ? 5 : 0) -
        (isLikelyProtected(c) ? 5 : 0)
      return score(b) - score(a)
    })
}

/** Columns eligible to be the protected attribute: non-ID, non-target, sorted protected-first. */
function protectedOptions(
  cols: string[],
  stats: Record<string, ColStat>,
  rows: number,
  excludeTarget: string,
): string[] {
  return cols
    .filter(c => !isIDLike(c, stats, rows) && c !== excludeTarget)
    .sort((a, b) => {
      const score = (c: string) =>
        (isLikelyProtected(c) ? 20 : 0) +
        (!isBinaryCol(c, stats) ? 5 : 0) -  // protected attrs are usually categorical
        (isLikelyTarget(c) ? 10 : 0) -
        (isLikelyPrediction(c) ? 10 : 0)
      return score(b) - score(a)
    })
}

/**
 * Columns eligible to be prediction outputs:
 * - must be binary (0/1)
 * - not ID-like
 * - not target, not protected
 * sorted prediction-name-first.
 */
function predictionOptions(
  cols: string[],
  stats: Record<string, ColStat>,
  rows: number,
  excludeTarget: string,
  excludeProtected: string,
): string[] {
  return cols
    .filter(c =>
      !isIDLike(c, stats, rows) &&
      c !== excludeTarget &&
      c !== excludeProtected &&
      isBinaryCol(c, stats),
    )
    .sort((a, b) => {
      const score = (c: string) =>
        (isLikelyPrediction(c) ? 20 : 0) -
        (isLikelyTarget(c) ? 10 : 0) -
        (isLikelyProtected(c) ? 10 : 0)
      return score(b) - score(a)
    })
}

// ── Constants ──────────────────────────────────────────────────────────────────

const ML_MODELS = [
  { key: 'logistic_regression', labelKey: 'model_lr' },
  { key: 'random_forest', labelKey: 'model_rf' },
  { key: 'xgboost', labelKey: 'model_xgb' },
]

interface ModeCard { key: AnalysisMode; labelKey: string; descKey: string; icon: React.ReactNode }

const MODES: ModeCard[] = [
  {
    key: 'ml',
    labelKey: 'config_mode_ml',
    descKey: 'config_mode_ml_desc',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5">
        <rect x="2" y="10" width="4" height="8" rx="1" fill="currentColor" />
        <rect x="8" y="6" width="4" height="12" rx="1" fill="currentColor" opacity=".7" />
        <rect x="14" y="2" width="4" height="16" rx="1" fill="currentColor" opacity=".4" />
      </svg>
    ),
  },
  {
    key: 'predictions',
    labelKey: 'config_mode_pred',
    descKey: 'config_mode_pred_desc',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5">
        <path d="M3 15l4-5 4 4 6-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    key: 'llm',
    labelKey: 'config_mode_llm',
    descKey: 'config_mode_llm_desc',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5">
        <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="2" />
        <path d="M10 7v3l2 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
]

// ── Component ──────────────────────────────────────────────────────────────────

export default function ConfigPanel() {
  const { t } = useTranslation()
  const { state, dispatch } = useApp()
  const upload = state.upload!
  const { columns: cols, col_stats: stats, rows } = upload

  const [mode, setMode] = useState<AnalysisMode>(state.mode)
  const [target, setTarget] = useState('')
  const [protected_, setProtected] = useState('')
  const [models, setModels] = useState<string[]>(['logistic_regression', 'random_forest'])
  const [predCol, setPredCol] = useState('')
  const [llmCols, setLlmCols] = useState<string[]>([])
  const [running, setRunning] = useState(false)
  const [runError, setRunError] = useState<string | null>(null)

  // ── Derived column lists ───────────────────────────────────────────────────

  const targetOpts = useMemo(
    () => targetOptions(cols, stats, rows, protected_),
    [cols, stats, rows, protected_],
  )
  const protectedOpts = useMemo(
    () => protectedOptions(cols, stats, rows, target),
    [cols, stats, rows, target],
  )
  const predOpts = useMemo(
    () => predictionOptions(cols, stats, rows, target, protected_),
    [cols, stats, rows, target, protected_],
  )

  // ── Smart defaults on mount ────────────────────────────────────────────────

  useEffect(() => {
    // Auto-select the most likely target (first binary + target-named column)
    const bestTarget = targetOptions(cols, stats, rows, '').find(
      c => isBinaryCol(c, stats) && isLikelyTarget(c),
    ) ?? targetOptions(cols, stats, rows, '')[0] ?? ''
    setTarget(bestTarget)

    // Auto-select the most likely protected attribute
    const bestProtected = protectedOptions(cols, stats, rows, bestTarget).find(
      c => isLikelyProtected(c),
    ) ?? ''
    setProtected(bestProtected)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-suggest LLM prediction columns ───────────────────────────────────

  useEffect(() => {
    if (mode === 'llm' && target && protected_) {
      const suggested = predictionOptions(cols, stats, rows, target, protected_)
      setLlmCols(suggested)
    }
  }, [mode, target, protected_]) // eslint-disable-line react-hooks/exhaustive-deps

  // Reset single pred col when mode changes to predictions
  useEffect(() => {
    if (mode === 'predictions') {
      const first = predictionOptions(cols, stats, rows, target, protected_)[0] ?? ''
      setPredCol(first)
    }
  }, [mode]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Validation ────────────────────────────────────────────────────────────

  const validationError = useMemo((): string | null => {
    if (!target) return t('error_no_target')
    if (!protected_) return t('error_no_protected')
    if (!isBinaryCol(target, stats)) return t('error_binary_target')
    if (mode === 'ml') {
      if (models.length === 0) return t('error_no_models')
      const featureCols = cols.filter(c => c !== target && c !== protected_)
      if (featureCols.length === 0) return t('error_no_features')
    }
    if (mode === 'predictions') {
      if (!predCol) return t('error_no_pred')
      if (!isBinaryCol(predCol, stats)) return t('error_binary_pred')
    }
    if (mode === 'llm') {
      if (llmCols.length === 0) return t('error_no_llm_cols')
      const bad = llmCols.filter(c => !isBinaryCol(c, stats))
      if (bad.length > 0) return `${t('error_binary_pred')}: ${bad.join(', ')}`
    }
    return null
  }, [target, protected_, mode, models, predCol, llmCols, stats, cols, t])

  const canRun = validationError === null

  // ── Helpers ───────────────────────────────────────────────────────────────

  const toggleModel = (key: string) =>
    setModels(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key])

  const toggleLlmCol = (col: string) =>
    setLlmCols(prev => prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col])

  const changeMode = (m: AnalysisMode) => {
    setMode(m)
    dispatch({ type: 'SET_MODE', mode: m })
    setRunError(null)
  }

  // ── Run ───────────────────────────────────────────────────────────────────

  const run = async () => {
    if (!canRun) return
    setRunError(null)
    setRunning(true)
    dispatch({ type: 'SET_ERROR', error: null })
    try {
      if (mode === 'ml') {
        const result = await analyzeML({
          dataset_id: upload.dataset_id,
          target_column: target,
          protected_attribute: protected_,
          models,
        })
        dispatch({ type: 'SET_ML_RESULT', result })
      } else if (mode === 'predictions') {
        const result = await analyzePredictions({
          dataset_id: upload.dataset_id,
          target_column: target,
          prediction_column: predCol,
          protected_attribute: protected_,
        })
        dispatch({ type: 'SET_PRED_RESULT', result })
      } else {
        const result = await analyzeLLM({
          dataset_id: upload.dataset_id,
          target_column: target,
          prediction_columns: llmCols,
          protected_attribute: protected_,
        })
        dispatch({ type: 'SET_LLM_RESULT', result })
      }
    } catch (e: any) {
      const msg = e?.response?.data?.detail ?? e.message ?? t('error_analysis')
      setRunError(msg)
    } finally {
      setRunning(false)
    }
  }

  if (running) return <LoadingSpinner message={t('loading_analysis')} />

  // ── Shared styles ─────────────────────────────────────────────────────────

  const colTagStyle = (binary: boolean) => ({
    fontSize: 9,
    fontWeight: 700,
    padding: '1px 5px',
    borderRadius: 4,
    marginLeft: 4,
    background: binary ? 'rgba(16,185,129,0.15)' : 'rgba(100,116,139,0.15)',
    color: binary ? '#10B981' : '#94A3B8',
  })

  const SelectField = ({
    label,
    hint,
    value,
    onChange,
    options,
    warnIfNotBinary,
  }: {
    label: string
    hint?: string
    value: string
    onChange: (v: string) => void
    options: string[]
    warnIfNotBinary?: boolean
  }) => {
    const selectedNotBinary = warnIfNotBinary && value && !isBinaryCol(value, stats)
    return (
      <div>
        <label className="section-label block mb-1.5">{label}</label>
        {hint && <p className="text-[10px] text-text-muted mb-2">{hint}</p>}
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="v1-select"
        >
          <option value="">{t('select_placeholder')}</option>
          {options.map(c => (
            <option key={c} value={c}>
              {c}
              {isBinaryCol(c, stats) ? ' ✓' : ''}
            </option>
          ))}
        </select>
        {selectedNotBinary && (
          <p className="text-[10px] mt-1" style={{ color: '#F59E0B' }}>
            ⚠ {t('warn_not_binary')}
          </p>
        )}
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const errorToShow = runError || state.error

  return (
    <div className="space-y-6 max-w-3xl">

      {/* ── Mode selector ───────────────────────────────────────────────── */}
      <div>
        <div className="section-label mb-3">{t('config_mode')}</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {MODES.map(m => (
            <button
              key={m.key}
              onClick={() => changeMode(m.key)}
              className="text-left p-4 rounded-xl border transition-all duration-150"
              style={
                mode === m.key
                  ? { backgroundColor: 'rgba(6,182,212,0.08)', borderColor: 'rgba(6,182,212,0.4)', color: '#06B6D4' }
                  : { backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', color: 'var(--color-text-dim)' }
              }
            >
              <div className="mb-2">{m.icon}</div>
              <div className="text-xs font-bold mb-1">{t(m.labelKey)}</div>
              <div className="text-[10px] leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                {t(m.descKey)}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Target + Protected ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SelectField
          label={t('config_target')}
          hint={t('config_target_hint')}
          value={target}
          onChange={setTarget}
          options={targetOpts}
          warnIfNotBinary
        />
        <SelectField
          label={t('config_protected')}
          hint={t('config_protected_hint')}
          value={protected_}
          onChange={setProtected}
          options={protectedOpts}
        />
      </div>

      {/* ── ML: model checkboxes ─────────────────────────────────────────── */}
      {mode === 'ml' && (
        <div>
          <div className="section-label mb-3">{t('config_models')}</div>
          <div className="flex flex-wrap gap-2">
            {ML_MODELS.map(m => (
              <button
                key={m.key}
                onClick={() => toggleModel(m.key)}
                className="px-4 py-2 rounded-lg text-xs font-semibold transition-all border"
                style={
                  models.includes(m.key)
                    ? { color: '#06B6D4', backgroundColor: 'rgba(6,182,212,0.10)', borderColor: 'rgba(6,182,212,0.4)' }
                    : { color: 'var(--color-text-dim)', backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }
                }
              >
                {models.includes(m.key) && <span className="mr-1.5">✓</span>}
                {t(m.labelKey)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Predictions: single column select ────────────────────────────── */}
      {mode === 'predictions' && (
        <SelectField
          label={t('config_pred_col')}
          hint={t('config_pred_hint')}
          value={predCol}
          onChange={setPredCol}
          options={predOpts.length > 0 ? predOpts : cols.filter(c => c !== target && c !== protected_)}
          warnIfNotBinary
        />
      )}

      {/* ── LLM: multi-select prediction columns ─────────────────────────── */}
      {mode === 'llm' && (
        <div>
          <div className="section-label mb-1">{t('config_llm_cols')}</div>
          <p className="text-[10px] text-text-muted mb-3">{t('config_llm_hint')}</p>

          {predOpts.length === 0 ? (
            <p className="text-xs py-3 px-4 rounded-lg" style={{ color: '#F59E0B', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
              ⚠ {t('warn_no_binary_cols')}
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {predOpts.map(col => (
                <button
                  key={col}
                  onClick={() => toggleLlmCol(col)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all border"
                  style={
                    llmCols.includes(col)
                      ? { color: '#8B5CF6', backgroundColor: 'rgba(139,92,246,0.10)', borderColor: 'rgba(139,92,246,0.4)' }
                      : { color: 'var(--color-text-dim)', backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }
                  }
                >
                  {llmCols.includes(col) && <span className="mr-1">✓</span>}
                  {col}
                </button>
              ))}
            </div>
          )}

          {/* Also show non-binary cols as disabled hint */}
          {cols.filter(c => c !== target && c !== protected_ && !isIDLike(c, stats, rows) && !isBinaryCol(c, stats)).length > 0 && (
            <p className="text-[10px] text-text-muted mt-2">
              {t('config_llm_nonbinary_hidden')}
            </p>
          )}
        </div>
      )}

      {/* ── Validation / run error ───────────────────────────────────────── */}
      {(errorToShow || (!canRun && (target || protected_))) && (
        <div
          className="flex items-start gap-3 px-4 py-3 rounded-xl text-sm"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444' }}
        >
          <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4 mt-0.5 flex-shrink-0">
            <path d="M8 5v4m0 2v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          <span>{errorToShow ?? validationError}</span>
        </div>
      )}

      {/* ── Run button ───────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <button
          onClick={run}
          disabled={!canRun}
          className="v1-btn-primary"
          title={canRun ? '' : (validationError ?? '')}
        >
          <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
            <path d="M4 3l9 5-9 5V3z" fill="white" />
          </svg>
          {t('config_run')}
        </button>
        <button onClick={() => dispatch({ type: 'RESET' })} className="v1-btn-ghost">
          ↩ {t('results_back')}
        </button>
      </div>
    </div>
  )
}
