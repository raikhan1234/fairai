import { useTranslation } from 'react-i18next'
import { useApp } from '../store'
import type { Lang } from '../types'
import clsx from 'clsx'

const LANGS: Lang[] = ['en', 'ru', 'kz']

const SunIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
    <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
    <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M11.54 3.05l-1.41 1.41M3.05 11.54l1.41 1.41" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)
const MoonIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
    <path d="M13 9.5A6 6 0 016.5 3c0-.5.06-1 .17-1.5A6.5 6.5 0 1014 10.5c-.5.06-1 .06-1 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

const CARDS = [
  {
    titleKey: 'lobby_card_ml',
    descKey: 'lobby_card_ml_desc',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
        <rect x="3" y="12" width="4" height="9" rx="1" fill="#06B6D4" opacity=".9" />
        <rect x="10" y="7" width="4" height="14" rx="1" fill="#06B6D4" opacity=".6" />
        <rect x="17" y="3" width="4" height="18" rx="1" fill="#06B6D4" opacity=".35" />
      </svg>
    ),
    accent: '#06B6D4',
    accentBg: 'rgba(6,182,212,0.08)',
    accentBorder: 'rgba(6,182,212,0.2)',
  },
  {
    titleKey: 'lobby_card_pred',
    descKey: 'lobby_card_pred_desc',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
        <path d="M3 17l5-6 5 5 8-10" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="3" cy="17" r="1.5" fill="#8B5CF6" />
        <circle cx="8" cy="11" r="1.5" fill="#8B5CF6" />
        <circle cx="13" cy="16" r="1.5" fill="#8B5CF6" />
        <circle cx="21" cy="7" r="1.5" fill="#8B5CF6" />
      </svg>
    ),
    accent: '#8B5CF6',
    accentBg: 'rgba(139,92,246,0.08)',
    accentBorder: 'rgba(139,92,246,0.2)',
  },
  {
    titleKey: 'lobby_card_llm',
    descKey: 'lobby_card_llm_desc',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
        <circle cx="12" cy="12" r="8" stroke="#10B981" strokeWidth="1.5" />
        <path d="M12 8v4l3 3" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="12" cy="12" r="2" fill="#10B981" opacity=".3" />
      </svg>
    ),
    accent: '#10B981',
    accentBg: 'rgba(16,185,129,0.08)',
    accentBorder: 'rgba(16,185,129,0.2)',
  },
]

export default function LandingPage() {
  const { t, i18n } = useTranslation()
  const { state, dispatch } = useApp()

  const setLang = (lang: Lang) => {
    dispatch({ type: 'SET_LANG', lang })
    i18n.changeLanguage(lang)
  }

  const toggleTheme = () => {
    const next = state.theme === 'dark' ? 'light' : 'dark'
    dispatch({ type: 'SET_THEME', theme: next })
  }

  const start = () => {
    dispatch({ type: 'SET_STEP', step: 'upload' })
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
    >
      {/* Top bar */}
      <header className="flex items-center justify-between px-8 py-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#06B6D4,#8B5CF6)', boxShadow: '0 4px 14px rgba(6,182,212,0.3)' }}
          >
            <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5">
              <path d="M4 16L8 7l4 5 4-9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="text-gradient font-bold text-lg">FairAI</span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          {/* Language */}
          <div className="flex gap-1">
            {LANGS.map(lang => (
              <button
                key={lang}
                onClick={() => setLang(lang)}
                className={clsx(
                  'px-3 py-1 text-xs font-bold uppercase rounded-lg transition-all duration-150',
                  state.lang === lang
                    ? 'bg-cyan text-white'
                    : 'text-text-muted hover:text-text-dim'
                )}
                style={state.lang === lang ? {} : { border: '1px solid var(--color-border)' }}
              >
                {lang}
              </button>
            ))}
          </div>

          {/* Theme */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg transition-all duration-150"
            style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-dim)' }}
            title={state.theme === 'dark' ? t('light_mode') : t('dark_mode')}
          >
            {state.theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-8"
          style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.25)', color: '#06B6D4' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-cyan inline-block" />
          Diploma Project · AI Fairness Platform
        </div>

        {/* Title */}
        <h1 className="text-5xl font-extrabold mb-4 text-gradient leading-tight">
          {t('lobby_title')}
        </h1>
        <p className="text-base font-medium max-w-xl mb-4" style={{ color: 'var(--color-text-dim)' }}>
          {t('lobby_subtitle')}
        </p>
        <p className="text-sm max-w-lg mb-10" style={{ color: 'var(--color-text-muted)' }}>
          {t('lobby_desc')}
        </p>

        {/* CTA */}
        <button
          onClick={start}
          className="v1-btn-primary px-10 py-3 text-base mb-16"
          style={{ boxShadow: '0 0 30px rgba(6,182,212,0.25)' }}
        >
          {t('lobby_start')}
          <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4 ml-1">
            <path d="M4 8h8M9 5l3 3-3 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-3xl w-full">
          {CARDS.map(card => (
            <div
              key={card.titleKey}
              className="rounded-2xl p-5 text-left"
              style={{ background: card.accentBg, border: `1px solid ${card.accentBorder}` }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                style={{ background: 'var(--color-surface)', border: `1px solid ${card.accentBorder}` }}
              >
                {card.icon}
              </div>
              <h3 className="text-sm font-bold mb-2" style={{ color: card.accent }}>
                {t(card.titleKey)}
              </h3>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-dim)' }}>
                {t(card.descKey)}
              </p>
            </div>
          ))}
        </div>

        {/* Metric pills */}
        <div className="flex flex-wrap gap-2 justify-center mt-10">
          {['Demographic Parity', 'Equal Opportunity', 'Equalized Odds', 'Group Analysis', 'EN / RU / KZ'].map(f => (
            <span
              key={f}
              className="px-3 py-1 rounded-full text-xs font-medium"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-dim)' }}
            >
              {f}
            </span>
          ))}
        </div>
      </main>
    </div>
  )
}
