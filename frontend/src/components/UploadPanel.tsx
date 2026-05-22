import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { useTranslation } from 'react-i18next'
import { useApp } from '../store'
import { uploadCSV } from '../api'
import LoadingSpinner from './LoadingSpinner'
import clsx from 'clsx'

export default function UploadPanel() {
  const { t } = useTranslation()
  const { state, dispatch } = useApp()
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) setFile(accepted[0])
    dispatch({ type: 'SET_ERROR', error: null })
  }, [dispatch])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    multiple: false,
    maxSize: 50 * 1024 * 1024,
    onDropRejected: () => dispatch({ type: 'SET_ERROR', error: t('error_upload') }),
  })

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    dispatch({ type: 'SET_ERROR', error: null })
    try {
      const result = await uploadCSV(file)
      dispatch({ type: 'SET_UPLOAD', upload: result })
    } catch (e: any) {
      dispatch({ type: 'SET_ERROR', error: e.message || t('error_upload') })
    } finally {
      setUploading(false)
    }
  }

  if (uploading) return <LoadingSpinner message={t('loading_upload')} />

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 flex flex-col items-center gap-8">

      {/* Header */}
      <div className="text-center">
        <div
          className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
          style={{
            background: 'linear-gradient(135deg,rgba(6,182,212,0.15),rgba(139,92,246,0.15))',
            border: '1px solid rgba(6,182,212,0.2)',
          }}
        >
          <svg viewBox="0 0 28 28" fill="none" className="w-8 h-8">
            <path d="M14 4v12m0 0l-4-4m4 4l4-4" stroke="#06B6D4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="4" y="18" width="20" height="6" rx="2" stroke="#8B5CF6" strokeWidth="2" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
          {t('upload_title')}
        </h1>
        <p className="text-sm text-text-muted">{t('upload_subtitle')}</p>
      </div>

      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={clsx(
          'w-full rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer transition-all duration-200',
        )}
        style={
          isDragActive
            ? { borderColor: '#06B6D4', backgroundColor: 'rgba(6,182,212,0.08)' }
            : file
            ? { borderColor: 'rgba(139,92,246,0.4)', backgroundColor: 'rgba(139,92,246,0.06)' }
            : { borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }
        }
      >
        <input {...getInputProps()} />

        {file ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(139,92,246,0.12)' }}>
              <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-violet">
                <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M20 12a8 8 0 11-16 0 8 8 0 0116 0z" stroke="currentColor" strokeWidth="2" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>{file.name}</p>
              <p className="text-xs text-text-muted mt-0.5">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
            <p className="text-xs text-text-muted">{t('upload_change')}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)' }}
            >
              <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-cyan">
                <path d="M12 4v12m0 0l-4-4m4 4l4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M4 20h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                {isDragActive ? t('upload_drop_active') : t('upload_drop_idle')}
              </p>
              <p className="text-xs text-text-muted mt-1">{t('upload_hint')}</p>
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {state.error && (
        <div
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444' }}
        >
          <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4 flex-shrink-0">
            <path d="M8 5v4m0 2v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          {state.error}
        </div>
      )}

      {/* Upload button */}
      {file && (
        <button onClick={handleUpload} className="v1-btn-primary">
          <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
            <path d="M3 8l4 4 6-7" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {t('upload_btn')}
        </button>
      )}
    </div>
  )
}
