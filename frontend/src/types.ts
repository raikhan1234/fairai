// ── API response types ─────────────────────────────────────────────────────────

export interface UploadResponse {
  dataset_id: string
  filename: string
  rows: number
  columns: string[]
  numeric_columns: string[]
  categorical_columns: string[]
  col_stats: Record<string, ColStat>
  preview: Record<string, string>[]
}

export interface ColStat {
  dtype: string
  nulls: number
  unique: number
  sample: string[]
}

export interface Performance {
  accuracy: number
  precision: number
  recall: number
  f1: number
}

export interface Fairness {
  dp_diff: number
  eo_diff: number
  eodds_diff: number
}

export interface GroupRow {
  group: string
  count: number
  selection_rate: number
  accuracy: number
  tpr: number
  fpr: number
}

export interface TradeoffPoint {
  model: string
  accuracy: number
  dp_diff: number
  f1: number
}

export type BiasLevel = 'low' | 'moderate' | 'high'

export interface ModelResult {
  model: string
  display_name: string
  performance: Performance
  fairness: Fairness
  bias_level: BiasLevel
  recommendation: string
  group_analysis: GroupRow[]
}

export interface MLAnalysisResponse {
  results: ModelResult[]
  best_model: string
  best_display_name: string
  tradeoff_data: TradeoffPoint[]
  feature_columns: string[]
  test_size: number
  train_size: number
}

export interface PredictionsAnalysisResponse extends ModelResult {
  total_records: number
}

export interface LLMAnalysisResponse {
  results: ModelResult[]
  best_model: string | null
  best_display_name: string | null
  tradeoff_data: TradeoffPoint[]
  total_records: number
}

// ── App state types ────────────────────────────────────────────────────────────

export type AnalysisMode = 'ml' | 'predictions' | 'llm'
export type AppStep = 'lobby' | 'upload' | 'configure' | 'results'
export type Lang = 'en' | 'ru' | 'kz'

export interface AppState {
  step: AppStep
  mode: AnalysisMode
  theme: 'dark' | 'light'
  lang: Lang
  upload: UploadResponse | null
  mlResult: MLAnalysisResponse | null
  predResult: PredictionsAnalysisResponse | null
  llmResult: LLMAnalysisResponse | null
  loading: boolean
  error: string | null
}
