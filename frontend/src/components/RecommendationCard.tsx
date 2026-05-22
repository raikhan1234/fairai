import { useTranslation } from 'react-i18next'
import type { BiasLevel, ModelResult } from '../types'
import clsx from 'clsx'

interface Props {
  bestModel: string
  results: ModelResult[]
}

const CONFIG: Record<BiasLevel, { bg: string; border: string; icon: string; iconBg: string; textColor: string }> = {
  low: {
    bg: 'rgba(16,185,129,0.06)',
    border: 'rgba(16,185,129,0.2)',
    icon: '✓',
    iconBg: 'rgba(16,185,129,0.15)',
    textColor: '#10B981',
  },
  moderate: {
    bg: 'rgba(245,158,11,0.06)',
    border: 'rgba(245,158,11,0.2)',
    icon: '⚠',
    iconBg: 'rgba(245,158,11,0.15)',
    textColor: '#F59E0B',
  },
  high: {
    bg: 'rgba(239,68,68,0.06)',
    border: 'rgba(239,68,68,0.2)',
    icon: '✕',
    iconBg: 'rgba(239,68,68,0.15)',
    textColor: '#EF4444',
  },
}

export default function RecommendationCard({ bestModel, results }: Props) {
  const { t } = useTranslation()
  const best = results.find(r => r.model === bestModel) ?? results[0]
  if (!best) return null

  const cfg = CONFIG[best.bias_level]

  return (
    <div className="rounded-2xl p-5 flex gap-4 items-start"
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-base font-bold"
        style={{ background: cfg.iconBg, color: cfg.textColor }}>
        {cfg.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 flex-wrap mb-2">
          <span className="text-sm font-bold" style={{ color: cfg.textColor }}>
            {t('results_recommendation')}
          </span>
          <span className={clsx(
            best.bias_level === 'low' ? 'pill-low' : best.bias_level === 'moderate' ? 'pill-moderate' : 'pill-high'
          )}>
            {t(`bias_${best.bias_level}`)}
          </span>
          <span className="text-xs text-text-muted">
            {t('results_best')}: <strong className="text-text">{best.display_name}</strong>
          </span>
        </div>
        <p className="text-sm text-text-dim leading-relaxed">{best.recommendation}</p>

        {/* Mini metrics */}
        <div className="mt-3 flex flex-wrap gap-4">
          {[
            { label: t('metric_accuracy'), value: (best.performance.accuracy * 100).toFixed(1) + '%' },
            { label: t('metric_f1'), value: best.performance.f1.toFixed(3) },
            { label: t('metric_dp'), value: best.fairness.dp_diff.toFixed(3) },
            { label: t('metric_eo'), value: best.fairness.eo_diff.toFixed(3) },
          ].map(m => (
            <div key={m.label} className="text-xs">
              <div className="text-text-muted">{m.label}</div>
              <div className="font-bold text-text">{m.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
