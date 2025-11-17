import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/axiosConfig'
import serversApi from '../../services/serversService'
import StatsCard from './StatsCard'
import MetricChart from './MetricChart'
import toast from 'react-hot-toast'

export default function Dashboard() {
  const navigate = useNavigate()
  // Start empty – we'll populate dynamically from API responses
  const [servers, setServers] = useState([])
  const [serverMetrics, setServerMetrics] = useState({})
  const [serverHistory, setServerHistory] = useState({})
  const [loading, setLoading] = useState(true)
  const [showGraphOnly, setShowGraphOnly] = useState(false)
  const [activeServer, setActiveServer] = useState(null)
  const activeServerRef = useRef(null)

  // helper to set active server state and keep a ref in sync so intervals/readers use latest
  const selectActiveServer = (id) => {
    setActiveServer(id)
    activeServerRef.current = id
  }

  // Prevent overlapping fetches for the frequent current-metrics polling
  const isFetchingCurrent = useRef(false)
  const initialLoad = useRef(true)

  const fetchCurrent = async () => {
    if (isFetchingCurrent.current) return
    isFetchingCurrent.current = true
    try {
      const currentResponse = await api.get('/metrics/current')
      console.log('Received current metrics:', currentResponse.data)
      // Handle both array (all servers) and object (single server) response
      if (Array.isArray(currentResponse.data)) {
        const newMetrics = {}
        currentResponse.data.forEach(m => {
          newMetrics[m.serverId] = { cpu: m.cpu, memory: m.memory, disk: m.disk }
        })
        setServerMetrics(prev => ({ ...prev, ...newMetrics }))
      } else {
        // Single server response
        setServerMetrics(prev => ({
          ...prev,
          [currentResponse.data.serverId]: {
            cpu: currentResponse.data.cpu,
            memory: currentResponse.data.memory,
            disk: currentResponse.data.disk
          }
        }))
      }
      if (initialLoad.current) {
        setLoading(false)
        initialLoad.current = false
      }
    } catch (error) {
      console.error('Error fetching current metrics:', error)
      const errorMessage = error.response
        ? `Error: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`
        : 'Network error - Make sure the backend server is running'
      if (initialLoad.current) toast.error(errorMessage)
    } finally {
      isFetchingCurrent.current = false
    }
  }

  const fetchHistory = async () => {
    return fetchHistoryFor(activeServer)
  }

  const fetchHistoryFor = async (serverId) => {
    if (!serverId) return
    try {
      const historyResponse = await api.get(`/metrics/history?serverId=${encodeURIComponent(serverId)}`)
      console.log(`Received metric history for ${serverId}:`, historyResponse.data)
      setServerHistory(prev => ({
        ...prev,
        [serverId]: historyResponse.data
      }))
    } catch (error) {
      console.error('Error fetching metric history for', serverId, error)
    }
  }

  const fetchServers = async () => {
    try {
      const list = await serversApi.getServers()
      setServers(list || [])
      if (!activeServer && list && list.length) {
        selectActiveServer(list[0].serverId)
      }
      return list
    } catch (err) {
      console.error('Failed to load servers', err)
      return []
    }
  }

  useEffect(() => {
    // Initial full load
    const boot = async () => {
      setLoading(true)
      // load servers first so we can select a server for history
      const list = await fetchServers()
      const initialServerId = (list && list.length && list[0].serverId) || null
      if (initialServerId) selectActiveServer(initialServerId)
      await Promise.all([fetchCurrent(), fetchHistoryFor(initialServerId)])
      setLoading(false)
      initialLoad.current = false
    }
    boot()

    // Poll current metrics every 2 seconds
    const currentInterval = setInterval(fetchCurrent, 2000)
  // Poll history less frequently (every 30s)
  const historyInterval = setInterval(() => fetchHistoryFor(activeServerRef.current), 30000)

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
    const history = serverHistory[activeServer] || []
    return history.map(metric => ({
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
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            {activeServer && <div className="text-sm text-gray-500">Server ID: <span className="font-medium">{activeServer}</span></div>}
          </div>
          <div className="space-x-2">
            <button 
              onClick={() => navigate('/')} 
              className="btn btn-ghost"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back
            </button>
            <button 
              onClick={() => navigate('/trends')} 
              className="btn btn-info"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Trends
            </button>
            <button 
              onClick={toggleView} 
              className="btn btn-outline"
            >
              {viewButtonText}
            </button>
            <button className="btn btn-primary" onClick={fetchMetrics}>Refresh</button>
          </div>
        </div>

        {/* Server Tabs (from canonical server list) */}
        <div className="tabs tabs-boxed mb-6 bg-base-300 p-2">
          {servers.length === 0 ? (
            <div className="text-sm text-gray-500 px-3">No servers yet</div>
          ) : (
            servers.map(s => (
              <button
                key={s.serverId}
                onClick={() => {
                  selectActiveServer(s.serverId)
                  fetchHistoryFor(s.serverId)
                }}
                className={`tab ${activeServer === s.serverId ? 'tab-active' : ''}`}
              >
                {s.serverId}
              </button>
            ))
          )}
        </div>

        {showStatsCards && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <StatsCard 
              title="CPU" 
              value={loading ? null : serverMetrics[activeServer]?.cpu} 
              unit="%" 
              color="bg-secondary" 
              loading={loading} 
            />
            <StatsCard 
              title="Memory" 
              value={loading ? null : serverMetrics[activeServer]?.memory} 
              unit="%" 
              color="bg-accent" 
              loading={loading} 
            />
            <StatsCard 
              title="Disk" 
              value={loading ? null : serverMetrics[activeServer]?.disk} 
              unit="%" 
              color="bg-success" 
              loading={loading} 
            />
          </div>
        )}

        {/* Charts for active server */}
        <div 
          className={graphContainerClass}
          style={showGraphOnly ? { height: '80vh' } : {}}
        >
          <MetricChart title={`${activeServer || 'Server'} - CPU (last 20)`} data={formatMetricHistory().map(s=>s.cpu)} color="#ef4444" />
          <MetricChart title={`${activeServer || 'Server'} - Memory (last 20)`} data={formatMetricHistory().map(s=>s.memory)} color="#f59e0b" />
          <MetricChart title={`${activeServer || 'Server'} - Disk (last 20)`} data={formatMetricHistory().map(s=>s.disk)} color="#10b981" />
        </div>
      </div>
    </div>
  )
}