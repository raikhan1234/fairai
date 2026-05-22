import React, { createContext, useContext, useReducer } from 'react'
import type { AppState, AnalysisMode, AppStep, Lang } from './types'
import type {
  UploadResponse,
  MLAnalysisResponse,
  PredictionsAnalysisResponse,
  LLMAnalysisResponse,
} from './types'

type Action =
  | { type: 'SET_STEP'; step: AppStep }
  | { type: 'SET_MODE'; mode: AnalysisMode }
  | { type: 'SET_THEME'; theme: 'dark' | 'light' }
  | { type: 'SET_LANG'; lang: Lang }
  | { type: 'SET_UPLOAD'; upload: UploadResponse }
  | { type: 'SET_ML_RESULT'; result: MLAnalysisResponse }
  | { type: 'SET_PRED_RESULT'; result: PredictionsAnalysisResponse }
  | { type: 'SET_LLM_RESULT'; result: LLMAnalysisResponse }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'RESET' }

function getSavedTheme(): 'dark' | 'light' {
  try {
    const v = localStorage.getItem('fairai-theme')
    return v === 'light' ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}

function getSavedLang(): Lang {
  try {
    const v = localStorage.getItem('fairai-lang')
    if (v === 'ru' || v === 'kz') return v
    return 'en'
  } catch {
    return 'en'
  }
}

const initial: AppState = {
  step: 'lobby',
  mode: 'ml',
  theme: getSavedTheme(),
  lang: getSavedLang(),
  upload: null,
  mlResult: null,
  predResult: null,
  llmResult: null,
  loading: false,
  error: null,
}

function applyTheme(theme: 'dark' | 'light') {
  const root = document.documentElement
  root.classList.toggle('dark', theme === 'dark')
  root.classList.toggle('light', theme === 'light')
  try { localStorage.setItem('fairai-theme', theme) } catch { /* noop */ }
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, step: action.step }
    case 'SET_MODE':
      return { ...state, mode: action.mode }
    case 'SET_THEME':
      applyTheme(action.theme)
      return { ...state, theme: action.theme }
    case 'SET_LANG':
      try { localStorage.setItem('fairai-lang', action.lang) } catch { /* noop */ }
      return { ...state, lang: action.lang }
    case 'SET_UPLOAD':
      return { ...state, upload: action.upload, step: 'configure' }
    case 'SET_ML_RESULT':
      return { ...state, mlResult: action.result, step: 'results', loading: false, error: null }
    case 'SET_PRED_RESULT':
      return { ...state, predResult: action.result, step: 'results', loading: false, error: null }
    case 'SET_LLM_RESULT':
      return { ...state, llmResult: action.result, step: 'results', loading: false, error: null }
    case 'SET_LOADING':
      return { ...state, loading: action.loading, error: null }
    case 'SET_ERROR':
      return { ...state, error: action.error, loading: false }
    case 'RESET':
      return { ...initial, theme: state.theme, lang: state.lang, step: 'upload' }
    default:
      return state
  }
}

interface CtxValue {
  state: AppState
  dispatch: React.Dispatch<Action>
}

const Ctx = createContext<CtxValue | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initial)
  return <Ctx.Provider value={{ state, dispatch }}>{children}</Ctx.Provider>
}

export function useApp() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
