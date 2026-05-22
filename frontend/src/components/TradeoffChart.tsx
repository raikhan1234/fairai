import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Label } from 'recharts'
import { useTranslation } from 'react-i18next'
import type { TradeoffPoint } from '../types'

interface Props {
  data: TradeoffPoint[]
}

const COLORS = ['#06B6D4', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#EC4899']

const CustomDot = (props: any) => {
  const { cx, cy, payload, index } = props
  const color = COLORS[index % COLORS.length]
  return (
    <g>
      <circle cx={cx} cy={cy} r={8} fill={color} fillOpacity={0.2} />
      <circle cx={cx} cy={cy} r={5} fill={color} />
      <text x={cx + 10} y={cy + 4} fill="#94A3B8" fontSize={10} fontWeight="600">
        {payload.model?.split(' ')[0]}
      </text>
    </g>
  )
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload as TradeoffPoint
  const biasBg = d.dp_diff < 0.02 ? 'rgba(16,185,129,0.12)' : d.dp_diff < 0.05 ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)'
  const biasColor = d.dp_diff < 0.02 ? '#10B981' : d.dp_diff < 0.05 ? '#F59E0B' : '#EF4444'
  return (
    <div className="v1-card px-4 py-3 text-xs">
      <p className="font-bold text-text mb-2">{d.model}</p>
      <div className="space-y-1">
        <div className="flex justify-between gap-6">
          <span className="text-text-dim">Accuracy</span>
          <span className="font-semibold text-cyan">{d.accuracy.toFixed(4)}</span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-text-dim">F1</span>
          <span className="font-semibold text-violet">{d.f1.toFixed(4)}</span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-text-dim">DP diff</span>
          <span className="font-bold" style={{ color: biasColor }}>{d.dp_diff.toFixed(4)}</span>
        </div>
      </div>
    </div>
  )
}

export default function TradeoffChart({ data }: Props) {
  const { t } = useTranslation()

  return (
    <div className="v1-panel p-5">
      <div className="panel-title mb-5">{t('results_tradeoff')}</div>
      <ResponsiveContainer width="100%" height={240}>
        <ScatterChart margin={{ top: 10, right: 30, bottom: 20, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis
            type="number"
            dataKey="accuracy"
            domain={['auto', 'auto']}
            name="Accuracy"
            tick={{ fill: '#64748B', fontSize: 10 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
            tickLine={false}
            tickFormatter={v => v.toFixed(2)}
          >
            <Label value="Accuracy →" position="bottom" offset={-5} fill="#64748B" fontSize={10} />
          </XAxis>
          <YAxis
            type="number"
            dataKey="dp_diff"
            name="DP Difference"
            tick={{ fill: '#64748B', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={v => v.toFixed(2)}
          >
            <Label value="DP diff ↑" position="insideLeft" angle={-90} fill="#64748B" fontSize={10} offset={10} />
          </YAxis>
          <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: 'rgba(6,182,212,0.2)' }} />
          <Scatter
            data={data}
            shape={<CustomDot />}
          />
        </ScatterChart>
      </ResponsiveContainer>
      <p className="text-[10px] text-text-muted mt-2 text-center">
        Ideal: high accuracy (right) + low DP diff (bottom)
      </p>
    </div>
  )
}
