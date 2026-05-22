import type {
  LLMAnalysisResponse,
  MLAnalysisResponse,
  PredictionsAnalysisResponse,
  UploadResponse,
} from './types'

// In production (Vercel), VITE_API_URL is set to the Railway backend URL
// In development, Vite proxy handles /api → localhost:8000
const BASE = import.meta.env.VITE_API_URL || '/api'

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(body.detail || `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

export async function uploadCSV(file: File): Promise<UploadResponse> {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${BASE}/upload`, { method: 'POST', body: form })
  return handleResponse<UploadResponse>(res)
}

export async function analyzeML(payload: {
  dataset_id: string
  target_column: string
  protected_attribute: string
  models: string[]
}): Promise<MLAnalysisResponse> {
  const res = await fetch(`${BASE}/analyze/ml`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return handleResponse<MLAnalysisResponse>(res)
}

export async function analyzePredictions(payload: {
  dataset_id: string
  target_column: string
  prediction_column: string
  protected_attribute: string
}): Promise<PredictionsAnalysisResponse> {
  const res = await fetch(`${BASE}/analyze/predictions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return handleResponse<PredictionsAnalysisResponse>(res)
}

export async function analyzeLLM(payload: {
  dataset_id: string
  target_column: string
  prediction_columns: string[]
  protected_attribute: string
}): Promise<LLMAnalysisResponse> {
  const res = await fetch(`${BASE}/analyze/llm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return handleResponse<LLMAnalysisResponse>(res)
}

export async function checkHealth(): Promise<{ status: string }> {
  const res = await fetch(`${BASE}/health`)
  return handleResponse(res)
}
