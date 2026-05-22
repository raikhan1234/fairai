interface Props {
  message?: string
}

export default function LoadingSpinner({ message = 'Loading...' }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-5 py-20">
      <div className="relative w-14 h-14">
        <div
          className="absolute inset-0 rounded-full animate-spin"
          style={{ border: '2px solid rgba(6,182,212,0.15)', borderTopColor: '#06B6D4' }}
        />
        <div
          className="absolute inset-2 rounded-full animate-spin"
          style={{ border: '2px solid rgba(139,92,246,0.15)', borderTopColor: '#8B5CF6', animationDirection: 'reverse', animationDuration: '0.6s' }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
            <path d="M3 13L7 5l4 5 4-8" stroke="#06B6D4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
      <p className="text-sm text-text-dim animate-pulse">{message}</p>
    </div>
  )
}
