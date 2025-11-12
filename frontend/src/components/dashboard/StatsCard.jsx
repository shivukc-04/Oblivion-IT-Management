import React from 'react'

export default function StatsCard({ title, value, unit = '%', color = 'bg-primary', loading = false }) {
  const display = value === null || value === undefined ? '—' : `${value}${unit}`
  const pct = typeof value === 'number' ? Math.max(0, Math.min(100, Math.round(value))) : 0

  return (
    <div className="card bg-base-100 shadow-sm">
      <div className="card-body">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">{title}</h3>
          <div className="text-2xl font-semibold">{loading ? 'Loading' : display}</div>
        </div>
        <div className="mt-3">
          <div className="w-full bg-base-200 rounded-full h-3 overflow-hidden">
            <div className={`${color} h-3`} style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>
    </div>
  )
}
