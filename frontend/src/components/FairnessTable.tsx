import { useTranslation } from 'react-i18next'
import type { ModelResult } from '../types'
import clsx from 'clsx'

interface Props {
  results: ModelResult[]
}

function dpColor(val: number): string {
  if (val < 0.02) return 'text-accent-green'
  if (val < 0.05) return 'text-accent-amber'
  return 'text-accent-red'
}

export default function FairnessTable({ results }: Props) {
  const { t } = useTranslation()

  return (
    <div className="v1-panel p-5">
      <div className="panel-title mb-4">{t('results_fairness')}</div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(6,182,212,0.1)' }}>
              {[t('table_model'), t('metric_accuracy'), t('metric_f1'), t('metric_dp'), t('metric_eo'), t('metric_eodds'), t('table_status')].map(h => (
                <th key={h} className="text-left px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-text-muted">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {results.map((r, i) => (
              <tr key={i} className="group" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                <td className="px-3 py-3 font-semibold text-text">{r.display_name}</td>
                <td className="px-3 py-3 text-cyan font-semibold">{(r.performance.accuracy * 100).toFixed(1)}%</td>
                <td className="px-3 py-3 text-violet font-semibold">{r.performance.f1.toFixed(4)}</td>
                <td className={clsx('px-3 py-3 font-bold', dpColor(r.fairness.dp_diff))}>
                  {r.fairness.dp_diff.toFixed(4)}
                </td>
                <td className={clsx('px-3 py-3 font-semibold', dpColor(r.fairness.eo_diff))}>
                  {r.fairness.eo_diff.toFixed(4)}
                </td>
                <td className={clsx('px-3 py-3 font-semibold', dpColor(r.fairness.eodds_diff))}>
                  {r.fairness.eodds_diff.toFixed(4)}
                </td>
                <td className="px-3 py-3">
                  <span className={clsx(
                    r.bias_level === 'low' ? 'pill-low' : r.bias_level === 'moderate' ? 'pill-moderate' : 'pill-high'
                  )}>
                    {t(`bias_${r.bias_level}`)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
