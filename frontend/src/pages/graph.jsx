import React from 'react'
import { Link } from 'react-router'
import MetricChart from '../components/dashboard/MetricChart'

// Graph page that shows full charts for CPU, Memory, Disk
export default function GraphPage(){
	// mock timeseries
	const series = Array.from({ length: 60 }, (_, i) => {
		return { t: Date.now() - (59 - i) * 60 * 1000, cpu: 30 + Math.round(Math.sin(i/5)*20 + Math.random()*10), memory: 50 + Math.round(Math.cos(i/6)*15 + Math.random()*8), disk: 70 + Math.round(Math.sin(i/7)*10 + Math.random()*5) }
	})

	return (
		<div data-theme="fantasy" className="min-h-screen bg-base-200 p-6">
			<div className="container mx-auto">
				<div className="flex items-center justify-between mb-6">
					<h1 className="text-2xl font-bold">Metrics Graphs</h1>
					<Link to="/dashboard" className="btn btn-ghost">Back to Dashboard</Link>
				</div>

				<div className="grid grid-cols-1 gap-4">
					<MetricChart title="CPU (%)" data={series.map(s=>s.cpu)} color="#ef4444" height={120} />
					<MetricChart title="Memory (%)" data={series.map(s=>s.memory)} color="#f59e0b" height={120} />
					<MetricChart title="Disk (%)" data={series.map(s=>s.disk)} color="#10b981" height={120} />
				</div>
			</div>
		</div>
	)
}

