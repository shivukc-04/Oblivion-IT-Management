import React, { useEffect, useState, useRef } from 'react'
import api from '../services/axiosConfig'
import serversApi from '../services/serversService'
import toast from 'react-hot-toast'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function TrendAnalysis() {
  const [servers, setServers] = useState([])
  const [activeServer, setActiveServer] = useState(null)
  const [allMetrics, setAllMetrics] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ cpu: {}, memory: {}, disk: {} })
  const [exporting, setExporting] = useState(false)

  const fetchServers = async () => {
    try {
      const list = await serversApi.getServers()
      setServers(list || [])
      if (!activeServer && list && list.length) {
        setActiveServer(list[0].serverId)
        return list[0].serverId
      }
      return activeServer
    } catch (err) {
      console.error('Failed to load servers', err)
      toast.error('Failed to load servers')
      return null
    }
  }

  const fetchAllMetrics = async (serverId) => {
    if (!serverId) return
    
    setLoading(true)
    try {
      const response = await api.get(`/metrics/history/all?serverId=${encodeURIComponent(serverId)}`)
      console.log(`Received all metrics for ${serverId}:`, response.data)
      setAllMetrics(response.data)
      calculateStats(response.data)
      toast.success(`Loaded ${response.data.length} metric records`)
    } catch (error) {
      console.error('Error fetching all metrics:', error)
      toast.error('Failed to fetch metric history')
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (metrics) => {
    if (!metrics || metrics.length === 0) {
      setStats({ cpu: {}, memory: {}, disk: {} })
      return
    }

    const calculate = (key) => {
      const values = metrics.map(m => m[key]).filter(v => typeof v === 'number')
      if (values.length === 0) return {}
      
      const sorted = [...values].sort((a, b) => a - b)
      return {
        min: Math.min(...values),
        max: Math.max(...values),
        avg: (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2),
        current: values[values.length - 1],
        median: sorted[Math.floor(sorted.length / 2)]
      }
    }

    setStats({
      cpu: calculate('cpu'),
      memory: calculate('memory'),
      disk: calculate('disk')
    })
  }

  useEffect(() => {
    const init = async () => {
      const serverId = await fetchServers()
      if (serverId) {
        await fetchAllMetrics(serverId)
      }
      setLoading(false)
    }
    init()
  }, [])

  const handleServerChange = async (serverId) => {
    setActiveServer(serverId)
    await fetchAllMetrics(serverId)
  }

  const exportToPDF = async () => {
    setExporting(true)
    toast.loading('Generating PDF report...', { id: 'pdf-export' })

    try {
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      let yPosition = 20

      // Title
      pdf.setFontSize(20)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Server Metrics Trend Analysis', pageWidth / 2, yPosition, { align: 'center' })
      
      yPosition += 10
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'normal')
      pdf.text(`Server: ${activeServer}`, pageWidth / 2, yPosition, { align: 'center' })
      
      yPosition += 5
      pdf.setFontSize(10)
      pdf.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, yPosition, { align: 'center' })
      pdf.text(`Total Records: ${allMetrics.length}`, pageWidth / 2, yPosition + 5, { align: 'center' })

      yPosition += 15

      // Statistics Summary Table
      pdf.setFontSize(14)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Statistics Summary', 14, yPosition)
      yPosition += 5

      const statsData = [
        ['Metric', 'Latest', 'Average', 'Min', 'Max'],
        ['CPU (%)', stats.cpu.current || '—', stats.cpu.avg || '—', stats.cpu.min || '—', stats.cpu.max || '—'],
        ['Memory (%)', stats.memory.current || '—', stats.memory.avg || '—', stats.memory.min || '—', stats.memory.max || '—'],
        ['Disk (%)', stats.disk.current || '—', stats.disk.avg || '—', stats.disk.min || '—', stats.disk.max || '—']
      ]

      autoTable(pdf, {
        startY: yPosition,
        head: [statsData[0]],
        body: statsData.slice(1),
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 10, cellPadding: 3 },
        columnStyles: {
          0: { fontStyle: 'bold', fillColor: [243, 244, 246] }
        }
      })

      yPosition = pdf.lastAutoTable.finalY + 15

      // Detailed Metrics Table
      if (yPosition > 250) {
        pdf.addPage()
        yPosition = 20
      }

      pdf.setFontSize(14)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Detailed Metrics History', 14, yPosition)
      yPosition += 5

      // Prepare data for table (show last 50 records to avoid overwhelming the PDF)
      const recentMetrics = allMetrics.slice(-50)
      const metricsTableData = recentMetrics.map((m, idx) => [
        idx + 1,
        new Date(m.createdAt).toLocaleString(),
        m.cpu + '%',
        m.memory + '%',
        m.disk + '%'
      ])

      autoTable(pdf, {
        startY: yPosition,
        head: [['#', 'Timestamp', 'CPU', 'Memory', 'Disk']],
        body: metricsTableData,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 2 },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 45 },
          2: { cellWidth: 20, halign: 'center' },
          3: { cellWidth: 20, halign: 'center' },
          4: { cellWidth: 20, halign: 'center' }
        }
      })

      // Add footer
      const totalPages = pdf.internal.getNumberOfPages()
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i)
        pdf.setFontSize(8)
        pdf.setFont('helvetica', 'italic')
        pdf.text(
          `Page ${i} of ${totalPages}`,
          pageWidth / 2,
          pdf.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        )
      }

      const fileName = `trend-report-${activeServer}-${new Date().toISOString().split('T')[0]}.pdf`
      pdf.save(fileName)
      
      toast.success('PDF exported successfully!', { id: 'pdf-export' })
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error(`Failed to export PDF: ${error.message}`, { id: 'pdf-export' })
    } finally {
      setExporting(false)
    }
  }

  const formatChartData = () => {
    return allMetrics.map((metric, index) => ({
      index: index + 1,
      time: new Date(metric.createdAt).toLocaleString(),
      cpu: metric.cpu,
      memory: metric.memory,
      disk: metric.disk
    }))
  }

  const StatCard = ({ title, stats, color }) => (
    <div className="card bg-base-100 shadow-sm">
      <div className="card-body">
        <h3 className="text-lg font-semibold mb-3">{title}</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-gray-500">Latest</div>
            <div className={`text-xl font-bold ${color}`}>{stats.current || '—'}%</div>
          </div>
          <div>
            <div className="text-gray-500">Average</div>
            <div className="text-xl font-bold">{stats.avg || '—'}%</div>
          </div>
          <div>
            <div className="text-gray-500">Min</div>
            <div className="text-lg font-medium">{stats.min || '—'}%</div>
          </div>
          <div>
            <div className="text-gray-500">Max</div>
            <div className="text-lg font-medium">{stats.max || '—'}%</div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div data-theme="fantasy" className="min-h-screen bg-base-200 p-6">
      <div className="container mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Trend Analysis</h1>
            {activeServer && (
              <div className="text-sm text-gray-500 mt-1">
                Historical data for: <span className="font-medium">{activeServer}</span>
                {allMetrics.length > 0 && (
                  <span className="ml-3">Total Records: <span className="font-medium">{allMetrics.length}</span></span>
                )}
              </div>
            )}
          </div>
          <div className="space-x-2">
            <button 
              className="btn btn-success" 
              onClick={exportToPDF}
              disabled={loading || !activeServer || allMetrics.length === 0 || exporting}
            >
              {exporting ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Exporting...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export PDF
                </>
              )}
            </button>
            <button 
              className="btn btn-primary" 
              onClick={() => fetchAllMetrics(activeServer)}
              disabled={loading || !activeServer}
            >
              {loading ? 'Loading...' : 'Refresh Data'}
            </button>
          </div>
        </div>

        {/* Server Tabs */}
        <div className="tabs tabs-boxed mb-6 bg-base-300 p-2">
          {servers.length === 0 ? (
            <div className="text-sm text-gray-500 px-3">No servers available</div>
          ) : (
            servers.map(s => (
              <button
                key={s.serverId}
                onClick={() => handleServerChange(s.serverId)}
                className={`tab ${activeServer === s.serverId ? 'tab-active' : ''}`}
              >
                {s.serverId}
              </button>
            ))
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : allMetrics.length === 0 ? (
          <div className="alert alert-info">
            <span>No historical metric data available for this server yet.</span>
          </div>
        ) : (
          <>
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <StatCard title="CPU Usage" stats={stats.cpu} color="text-error" />
              <StatCard title="Memory Usage" stats={stats.memory} color="text-warning" />
              <StatCard title="Disk Usage" stats={stats.disk} color="text-success" />
            </div>

            {/* Combined Chart */}
            <div className="card bg-base-100 shadow-sm mb-6">
              <div className="card-body">
                <h3 className="text-xl font-semibold mb-4">Historical Metrics Overview</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={formatChartData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="index" 
                      label={{ value: 'Data Point', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis 
                      label={{ value: 'Usage (%)', angle: -90, position: 'insideLeft' }}
                      domain={[0, 100]}
                    />
                    <Tooltip 
                      labelFormatter={(value) => `Point #${value}`}
                      formatter={(value) => [`${value}%`, '']}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="cpu" 
                      stroke="#ef4444" 
                      name="CPU"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="memory" 
                      stroke="#f59e0b" 
                      name="Memory"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="disk" 
                      stroke="#10b981" 
                      name="Disk"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Individual Metric Charts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* CPU Chart */}
              <div className="card bg-base-100 shadow-sm">
                <div className="card-body">
                  <h3 className="text-lg font-semibold mb-3">CPU Trend</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={formatChartData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="index" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="cpu" 
                        stroke="#ef4444" 
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Memory Chart */}
              <div className="card bg-base-100 shadow-sm">
                <div className="card-body">
                  <h3 className="text-lg font-semibold mb-3">Memory Trend</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={formatChartData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="index" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="memory" 
                        stroke="#f59e0b" 
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Disk Chart */}
              <div className="card bg-base-100 shadow-sm">
                <div className="card-body">
                  <h3 className="text-lg font-semibold mb-3">Disk Trend</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={formatChartData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="index" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="disk" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}