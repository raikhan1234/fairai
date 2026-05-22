import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts'
import { useTranslation } from 'react-i18next'
import type { ModelResult } from '../types'

interface Props {
  results: ModelResult[]
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  const getColor = (val: number) => val < 0.02 ? '#10B981' : val < 0.05 ? '#F59E0B' : '#EF4444'
  return (
    <div className="v1-card px-4 py-3 text-xs space-y-1.5 min-w-[180px]">
      <p className="font-bold text-text mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-4">
          <span className="text-text-dim">{p.dataKey}:</span>
          <span className="font-bold" style={{ color: getColor(p.value) }}>{p.value?.toFixed(4)}</span>
        </div>
      ))}
    </div>
  )
}

const BiasLabel = ({ x, y, width, value }: any) => {
  if (value === undefined) return null
  const color = value < 0.02 ? '#10B981' : value < 0.05 ? '#F59E0B' : '#EF4444'
  return (
    <text x={x + width / 2} y={y - 4} fill={color} textAnchor="middle" fontSize={9} fontWeight="700">
      {value.toFixed(3)}
    </text>
  )
}

export default function FairnessChart({ results }: Props) {
  const { t } = useTranslation()

  const data = results.map(r => ({
    name: r.display_name,
    [t('metric_dp')]: r.fairness.dp_diff,
    [t('metric_eo')]: r.fairness.eo_diff,
    [t('metric_eodds')]: r.fairness.eodds_diff,
  }))

  return (
    <div className="v1-panel p-5">
      <div className="panel-title mb-5">{t('results_fairness')}</div>
      <div className="flex gap-3 mb-4 flex-wrap">
        <span className="pill-low">DP diff &lt; 0.02 — {t('bias_low')}</span>
        <span className="pill-moderate">0.02–0.05 — {t('bias_moderate')}</span>
        <span className="pill-high">&gt; 0.05 — {t('bias_high')}</span>
      </div>
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
            tick={{ fill: '#64748B', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={v => v.toFixed(2)}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(239,68,68,0.04)' }} />
          <ReferenceLine y={0.02} stroke="#10B981" strokeDasharray="4 2" strokeOpacity={0.5} />
          <ReferenceLine y={0.05} stroke="#F59E0B" strokeDasharray="4 2" strokeOpacity={0.5} />
          <Legend wrapperStyle={{ fontSize: 11, color: '#64748B', paddingTop: 12 }} iconType="circle" iconSize={8} />
          <Bar dataKey={t('metric_dp')} fill="#EF4444" radius={[4, 4, 0, 0]} label={<BiasLabel />} />
          <Bar dataKey={t('metric_eo')} fill="#F97316" radius={[4, 4, 0, 0]} />
          <Bar dataKey={t('metric_eodds')} fill="#F59E0B" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
