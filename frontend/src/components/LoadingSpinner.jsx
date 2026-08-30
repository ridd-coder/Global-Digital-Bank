import React from 'react'

export default function LoadingSpinner({ size = 'md', text = '' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }
  return (
    <div className="flex flex-col items-center justify-center gap-3 min-h-[200px]">
      <div className={`${sizes[size]} border-2 border-surface-700 border-t-primary-500 rounded-full animate-spin`} />
      {text && <p className="text-sm text-surface-400">{text}</p>}
    </div>
  )
}

export function PageLoader() {
  return (
    <div className="fixed inset-0 bg-surface-950 flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-2 border-surface-700 border-t-primary-500 rounded-full animate-spin" />
        <p className="text-surface-400 text-sm">Loading...</p>
      </div>
    </div>
  )
}
