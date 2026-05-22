import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts'
import { useTranslation } from 'react-i18next'
import type { ModelResult } from '../types'

interface Props {
  results: ModelResult[]
}

const COLORS = ['#06B6D4', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#EC4899']

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="v1-card px-4 py-3 text-xs space-y-1.5">
      <p className="font-bold text-text mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.fill }} />
          <span className="text-text-dim capitalize">{p.dataKey}:</span>
          <span className="font-semibold text-text">{p.value?.toFixed(4)}</span>
        </div>
      ))}
    </div>
  )
}

export default function PerformanceChart({ results }: Props) {
  const { t } = useTranslation()

  const data = results.map(r => ({
    name: r.display_name,
    [t('metric_accuracy')]: r.performance.accuracy,
    [t('metric_f1')]: r.performance.f1,
    [t('metric_precision')]: r.performance.precision,
    [t('metric_recall')]: r.performance.recall,
  }))

  return (
    <div className="v1-panel p-5">
      <div className="panel-title mb-5">{t('results_performance')}</div>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} barCategoryGap="28%" barGap={3}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis
            dataKey="name"
            tick={{ fill: '#64748B', fontSize: 11 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 1]}
            tick={{ fill: '#64748B', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={v => v.toFixed(1)}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(6,182,212,0.04)' }} />
          <Legend
            wrapperStyle={{ fontSize: 11, color: '#64748B', paddingTop: 12 }}
            iconType="circle"
            iconSize={8}
          />
          <Bar dataKey={t('metric_accuracy')} fill="#06B6D4" radius={[4, 4, 0, 0]} />
          <Bar dataKey={t('metric_f1')} fill="#8B5CF6" radius={[4, 4, 0, 0]} />
          <Bar dataKey={t('metric_precision')} fill="#10B981" radius={[4, 4, 0, 0]} />
          <Bar dataKey={t('metric_recall')} fill="#F59E0B" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
