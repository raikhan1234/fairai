import { useTranslation } from 'react-i18next'
import { useApp } from '../store'
import type { AnalysisMode, Lang } from '../types'
import clsx from 'clsx'

const LANGS: Lang[] = ['en', 'ru', 'kz']

const BarChartIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
    <rect x="1" y="8" width="3" height="7" rx="1" fill="currentColor" />
    <rect x="6" y="4" width="3" height="11" rx="1" fill="currentColor" opacity=".6" />
    <rect x="11" y="1" width="3" height="14" rx="1" fill="currentColor" opacity=".35" />
  </svg>
)
const ClockIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
    <path d="M8 5v3l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)
const TrendIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
    <path d="M2 12l4-4 3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const UploadIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
    <path d="M8 2v4m0 0L6 4m2 2l2-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <rect x="2" y="9" width="12" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
  </svg>
)
const TableIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
    <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M5 8h6M5 5h6M5 11h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)
const SunIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5">
    <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
    <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M11.54 3.05l-1.41 1.41M3.05 11.54l1.41 1.41" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)
const MoonIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5">
    <path d="M13 9.5A6 6 0 016.5 3c0-.5.06-1 .17-1.5A6.5 6.5 0 1014 10.5c-.5.06-1 .06-1 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

interface NavItem {
  key: AnalysisMode
  labelKey: string
  icon: React.ReactNode
}

const NAV_ITEMS: NavItem[] = [
  { key: 'ml', labelKey: 'nav_ml', icon: <BarChartIcon /> },
  { key: 'llm', labelKey: 'nav_llm', icon: <ClockIcon /> },
  { key: 'predictions', labelKey: 'nav_predictions', icon: <TrendIcon /> },
]

export default function Sidebar() {
  const { t, i18n } = useTranslation()
  const { state, dispatch } = useApp()

  const setMode = (mode: AnalysisMode) => {
    dispatch({ type: 'SET_MODE', mode })
    if (state.step === 'results') dispatch({ type: 'SET_STEP', step: 'configure' })
  }

  const setLang = (lang: Lang) => {
    dispatch({ type: 'SET_LANG', lang })
    i18n.changeLanguage(lang)
  }

  const toggleTheme = () => {
    const next = state.theme === 'dark' ? 'light' : 'dark'
    dispatch({ type: 'SET_THEME', theme: next })
  }

  return (
    <aside
      className="w-60 flex-shrink-0 flex flex-col"
      style={{
        backgroundColor: 'var(--color-surface)',
        borderRight: '1px solid var(--color-border)',
      }}
    >
      {/* Logo */}
      <div className="px-5 py-6" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <button
          onClick={() => dispatch({ type: 'SET_STEP', step: 'lobby' })}
          className="flex items-center gap-3 w-full text-left"
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#06B6D4,#8B5CF6)', boxShadow: '0 4px 14px rgba(6,182,212,0.3)' }}
          >
            <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5">
              <path d="M4 16L8 7l4 5 4-9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <div className="font-bold text-sm text-gradient leading-tight">FairAI</div>
            <div className="text-[10px] text-text-muted uppercase tracking-wider mt-0.5">Fairness Dashboard</div>
          </div>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2">
        <div className="section-label px-3 mb-2">{t('nav_analysis')}</div>
        {NAV_ITEMS.map(item => (
          <button
            key={item.key}
            onClick={() => setMode(item.key)}
            className={clsx('nav-item', state.mode === item.key && 'active')}
          >
            {item.icon}
            {t(item.labelKey)}
          </button>
        ))}

        <div className="section-label px-3 mt-5 mb-2">{t('nav_data')}</div>
        <button
          onClick={() => dispatch({ type: 'SET_STEP', step: 'upload' })}
          className={clsx('nav-item', state.step === 'upload' && 'active')}
        >
          <UploadIcon />
          {t('nav_upload')}
        </button>
        <button
          onClick={() => state.upload && dispatch({ type: 'SET_STEP', step: 'configure' })}
          className={clsx(
            'nav-item',
            state.step === 'configure' && 'active',
            !state.upload && 'opacity-40 cursor-not-allowed'
          )}
          disabled={!state.upload}
        >
          <TableIcon />
          {t('nav_preview')}
        </button>
      </nav>

      {/* Footer controls */}
      <div className="px-4 py-4" style={{ borderTop: '1px solid var(--color-border)' }}>
        {/* Language selector */}
        <div className="flex gap-1.5 mb-4">
          {LANGS.map(lang => (
            <button
              key={lang}
              onClick={() => setLang(lang)}
              className={clsx(
                'flex-1 py-1.5 text-[10px] font-bold uppercase rounded-lg transition-all duration-150',
                state.lang === lang
                  ? 'text-cyan bg-cyan-muted'
                  : 'text-text-muted hover:text-text-dim'
              )}
              style={
                state.lang === lang
                  ? { border: '1px solid rgba(6,182,212,0.4)' }
                  : { border: '1px solid var(--color-border)' }
              }
            >
              {lang}
            </button>
          ))}
        </div>

        {/* Theme toggle */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-text-muted flex items-center gap-1.5">
            {state.theme === 'dark' ? <MoonIcon /> : <SunIcon />}
            {state.theme === 'dark' ? t('dark_mode') : t('light_mode')}
          </span>
          <button
            onClick={toggleTheme}
            className="w-10 h-5 rounded-full relative transition-colors duration-200 flex-shrink-0"
            style={{
              background: state.theme === 'dark'
                ? 'linear-gradient(135deg,#06B6D4,#8B5CF6)'
                : '#CBD5E1'
            }}
          >
            <span
              className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200"
              style={{ transform: state.theme === 'dark' ? 'translateX(22px)' : 'translateX(2px)' }}
            />
          </button>
        </div>
      </div>
    </aside>
  )
}
