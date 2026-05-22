import { useTranslation } from 'react-i18next'
import { useApp } from '../store'

export default function DatasetPreview() {
  const { t } = useTranslation()
  const { state } = useApp()
  const upload = state.upload
  if (!upload) return null

  const cols = upload.columns
  const rows = upload.preview

  return (
    <div className="v1-panel p-5 overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div className="panel-title">{t('preview_title')}</div>
        <div className="flex items-center gap-3 text-xs text-text-muted">
          <span className="px-2 py-0.5 rounded-md text-xs font-semibold" style={{ background: 'rgba(6,182,212,0.1)', color: '#06B6D4' }}>
            {upload.rows.toLocaleString()} {t('preview_rows')}
          </span>
          <span className="px-2 py-0.5 rounded-md text-xs font-semibold" style={{ background: 'rgba(139,92,246,0.1)', color: '#8B5CF6' }}>
            {cols.length} {t('preview_cols')}
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr>
              {cols.map(col => (
                <th key={col} className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-text-muted whitespace-nowrap"
                  style={{ borderBottom: '1px solid rgba(6,182,212,0.1)' }}>
                  <div>{col}</div>
                  <div className="font-normal normal-case tracking-normal text-text-muted/60 mt-0.5">
                    {upload.col_stats[col]?.dtype}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="group">
                {cols.map(col => (
                  <td key={col} className="px-3 py-2 text-text-dim group-hover:text-text transition-colors whitespace-nowrap"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    {row[col] ?? '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Col stats summary */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {cols.slice(0, 8).map(col => {
          const stat = upload.col_stats[col]
          return (
            <div key={col} className="rounded-lg px-3 py-2" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div className="text-[10px] font-semibold text-text-muted truncate">{col}</div>
              <div className="text-[10px] text-text-dim mt-0.5">
                {stat.unique} unique · {stat.nulls} nulls
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
