import clsx from 'clsx'

type Accent = 'cyan' | 'violet' | 'green' | 'red' | 'amber'

const ACCENT_STYLES: Record<Accent, { bar: string; value: string; top: string }> = {
  cyan:   { bar: 'from-cyan to-violet', value: 'text-cyan',  top: 'from-cyan/80 to-transparent' },
  violet: { bar: 'from-violet to-cyan', value: 'text-violet', top: 'from-violet/80 to-transparent' },
  green:  { bar: 'from-accent-green to-cyan', value: 'text-accent-green', top: 'from-accent-green/80 to-transparent' },
  red:    { bar: 'from-accent-red to-violet',  value: 'text-accent-red',  top: 'from-accent-red/80 to-transparent' },
  amber:  { bar: 'from-accent-amber to-accent-red', value: 'text-accent-amber', top: 'from-accent-amber/80 to-transparent' },
}

interface Props {
  label: string
  value: string | number
  sub?: string
  accent?: Accent
  className?: string
}

export default function MetricCard({ label, value, sub, accent = 'cyan', className }: Props) {
  const s = ACCENT_STYLES[accent]
  return (
    <div className={clsx('v1-card p-5 relative overflow-hidden', className)}>
      {/* Top gradient line */}
      <div className={clsx('absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r', s.top)} />

      <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-3">
        {label}
      </div>
      <div className={clsx('text-3xl font-extrabold tracking-tight leading-none', s.value)}>
        {typeof value === 'number' ? value.toFixed(3) : value}
      </div>
      {sub && (
        <div className="text-xs text-text-muted mt-2.5 leading-relaxed">{sub}</div>
      )}
    </div>
  )
}
