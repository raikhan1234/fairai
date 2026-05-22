import { useTranslation } from 'react-i18next'
import type { ModelResult } from '../types'
import clsx from 'clsx'

interface Props {
  results: ModelResult[]
}

function selectionColor(rate: number) {
  if (rate > 0.6) return 'text-accent-red'
  if (rate > 0.4) return 'text-accent-amber'
  return 'text-accent-green'
}

function tprColor(tpr: number) {
  if (tpr > 0.7) return 'text-accent-green'
  if (tpr > 0.4) return 'text-accent-amber'
  return 'text-accent-red'
}

export default function GroupTable({ results }: Props) {
  const { t } = useTranslation()

  return (
    <div className="v1-panel p-5">
      <div className="panel-title mb-5">{t('results_groups')}</div>
      <div className="space-y-8">
        {results.map(r => (
          <div key={r.model}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-bold text-text">{r.display_name}</span>
              <span className={clsx(
                r.bias_level === 'low' ? 'pill-low' : r.bias_level === 'moderate' ? 'pill-moderate' : 'pill-high'
              )}>
                {t(`bias_${r.bias_level}`)}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(6,182,212,0.1)' }}>
                    {[t('table_group'), t('table_count'), t('table_sel_rate'), t('table_accuracy'), t('metric_tpr'), t('metric_fpr')].map(h => (
                      <th key={h} className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-text-muted">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {r.group_analysis.map((row, i) => (
                    <tr key={i} className="group" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td className="px-3 py-2.5 font-semibold text-text">{row.group}</td>
                      <td className="px-3 py-2.5 text-text-dim">{row.count}</td>
                      <td className={clsx('px-3 py-2.5 font-semibold', selectionColor(row.selection_rate))}>
                        {(row.selection_rate * 100).toFixed(1)}%
                      </td>
                      <td className="px-3 py-2.5 text-text-dim">{(row.accuracy * 100).toFixed(1)}%</td>
                      <td className={clsx('px-3 py-2.5 font-semibold', tprColor(row.tpr))}>
                        {(row.tpr * 100).toFixed(1)}%
                      </td>
                      <td className="px-3 py-2.5 text-text-dim">{(row.fpr * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
