import React, { useEffect, useState, useRef } from 'react'
import api from '../../services/axiosConfig'
import StatsCard from './StatsCard'
import MetricChart from './MetricChart'
import toast from 'react-hot-toast'

export default function Dashboard() {
  const [metrics, setMetrics] = useState({ cpu: 0, memory: 0, disk: 0 })
  const [metricHistory, setMetricHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [showGraphOnly, setShowGraphOnly] = useState(false) 

  // Prevent overlapping fetches for the frequent current-metrics polling
  const isFetchingCurrent = useRef(false)
  const initialLoad = useRef(true)

  const fetchCurrent = async () => {
    if (isFetchingCurrent.current) return
    isFetchingCurrent.current = true
    try {
      const currentResponse = await api.get('/metrics/current')
      console.log('Received current metrics:', currentResponse.data)
      setMetrics(currentResponse.data)
      if (initialLoad.current) {
        setLoading(false)
        initialLoad.current = false
      }
    } catch (error) {
      console.error('Error fetching current metrics:', error)
      const errorMessage = error.response
        ? `Error: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`
        : 'Network error - Make sure the backend server is running'
      // Only show toast on first load to avoid spamming every 2s
      if (initialLoad.current) toast.error(errorMessage)
    } finally {
      isFetchingCurrent.current = false
    }
  }

  const fetchHistory = async () => {
    try {
      const historyResponse = await api.get('/metrics/history')
      console.log('Received metric history:', historyResponse.data)
      setMetricHistory(historyResponse.data)
    } catch (error) {
      console.error('Error fetching metric history:', error)
      // quieter notification for history
    }
  }

  useEffect(() => {
    // Initial full load
    const boot = async () => {
      setLoading(true)
      await Promise.all([fetchCurrent(), fetchHistory()])
      setLoading(false)
      initialLoad.current = false
    }
    boot()

    // Poll current metrics every 2 seconds
    const currentInterval = setInterval(fetchCurrent, 2000)
    // Poll history less frequently (every 30s)
    const historyInterval = setInterval(fetchHistory, 30000)

    return () => {
      clearInterval(currentInterval)
      clearInterval(historyInterval)
    }
  }, [])

  const toggleView = () => {
    setShowGraphOnly(prevShowGraphOnly => !prevShowGraphOnly);
  };

  // Backwards-compatible wrapper used by the Refresh button
  const fetchMetrics = async () => {
    // show spinner only when it's the initial load or explicitly triggered
    setLoading(true)
    await Promise.all([fetchCurrent(), fetchHistory()])
    setLoading(false)
  }
  
  const viewButtonText = showGraphOnly ? 'Show Full Dashboard' : 'Focus on Graphs';
  const showStatsCards = !showGraphOnly; 

  const formatMetricHistory = () => {
    return metricHistory.map(metric => ({
      timestamp: new Date(metric.createdAt).getTime(),
      cpu: metric.cpu,
      memory: metric.memory,
      disk: metric.disk
    }))
  }

  // Dynamically determine the class for the graph container
  const graphContainerClass = showGraphOnly 
    ? "grid grid-cols-1 gap-4 full-page-graphs" 
    : "grid grid-cols-1 md:grid-cols-3 gap-4"; 

  return (
    <div data-theme="fantasy" className="min-h-screen bg-base-200 p-6">
      <div className="container mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <div className="space-x-2">
            <button 
              onClick={toggleView} 
              className="btn btn-outline"
            >
              {viewButtonText}
            </button>
            <button className="btn btn-primary" onClick={fetchMetrics}>Refresh</button>
          </div>
        </div>

        {showStatsCards && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <StatsCard title="CPU" value={loading ? null : metrics.cpu} unit="%" color="bg-secondary" loading={loading} />
            <StatsCard title="Memory" value={loading ? null : metrics.memory} unit="%" color="bg-accent" loading={loading} />
            <StatsCard title="Disk" value={loading ? null : metrics.disk} unit="%" color="bg-success" loading={loading} />
          </div>
        )}

        {/* KEY CHANGE HERE: We apply an inline height style when focused.
          This ensures the chart library has a height value to render against.
        */}
        <div 
          className={graphContainerClass}
          style={showGraphOnly ? { height: '80vh' } : {}}
        >
          <MetricChart title="CPU (last 20)" data={formatMetricHistory().map(s=>s.cpu)} color="#ef4444" />
          <MetricChart title="Memory (last 20)" data={formatMetricHistory().map(s=>s.memory)} color="#f59e0b" />
          <MetricChart title="Disk (last 20)" data={formatMetricHistory().map(s=>s.disk)} color="#10b981" />
        </div>
      </div>
    </div>
  )
}