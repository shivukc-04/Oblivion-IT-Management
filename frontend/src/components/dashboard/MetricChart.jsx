import React from 'react'

// Very small, dependency-free sparkline-like chart for quick prototyping.
export default function MetricChart({ title, data = [], color = '#3b82f6', height = 60 }) {
  // data: array of numbers or { value }
  const values = data.map(d => (typeof d === 'number' ? d : d.value)).filter(v => typeof v === 'number')
  const padding = 4
  const w = 300
  const h = height

  if (values.length === 0) {
    return (
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <h4 className="font-medium">{title}</h4>
          <div className="text-sm text-muted">No data</div>
        </div>
      </div>
    )
  }

  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1

  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * (w - padding * 2) + padding
    const y = h - padding - ((v - min) / range) * (h - padding * 2)
    return `${x},${y}`
  }).join(' ')

  return (
    <div className="card bg-base-100 shadow-sm">
      <div className="card-body">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium">{title}</h4>
        </div>
        <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h}>
          <polyline fill="none" stroke={color} strokeWidth="2" points={points} />
        </svg>
      </div>
    </div>
  )
}
