import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import auditService from '../services/AuditService.js';
import toast from 'react-hot-toast';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();

  // Filters
  const [filters, setFilters] = useState({
    method: '',
    eventType: '',
    userId: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [page, filters]);

  async function fetchLogs() {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 20,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, v]) => v !== '')
        )
      };
      
      const data = await auditService.getAllLogs(params);
      setLogs(data.data);
      setTotalPages(data.pagination.pages);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) {
        toast.error('You are not logged in');
        navigate('/login');
        return;
      }
      if (err.response?.status === 403) {
        toast.error('Access denied. Admin only.');
        navigate('/');
        return;
      }
      toast.error('Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  }

  async function fetchStats() {
    try {
      const data = await auditService.getStats();
      setStats(data.data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }

  function handleFilterChange(key, value) {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1); // Reset to first page when filter changes
  }

  function clearFilters() {
    setFilters({
      method: '',
      eventType: '',
      userId: '',
      startDate: '',
      endDate: ''
    });
    setPage(1);
  }

  function formatDate(dateString) {
    return new Date(dateString).toLocaleString();
  }

  function getStatusBadgeColor(statusCode) {
    if (statusCode >= 200 && statusCode < 300) return 'badge-success';
    if (statusCode >= 400 && statusCode < 500) return 'badge-warning';
    if (statusCode >= 500) return 'badge-error';
    return 'badge-info';
  }

  function getEventTypeBadgeColor(eventType) {
    const colors = {
      Login: 'badge-primary',
      Logout: 'badge-secondary',
      Create: 'badge-success',
      Update: 'badge-info',
      Delete: 'badge-error',
      View: 'badge-ghost',
      Other: 'badge-neutral'
    };
    return colors[eventType] || 'badge-neutral';
  }

  if (loading && logs.length === 0) {
    return <div className="p-6">Loading audit logs...</div>;
  }

  return (
    <div className="p-6 min-h-screen bg-base-200">
      
      {/* Header */}
      <div className="mb-6">
            <button 
              onClick={() => navigate('/')} 
              className="btn btn-ghost"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back
            </button>
        <h1 className="text-3xl font-bold">Audit Logs</h1>
        <p className="text-sm text-gray-500">View and filter all system activity logs</p>
      </div>
      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="card bg-base-100 shadow-md">
            <div className="card-body">
              <h2 className="card-title text-sm">Total Requests</h2>
              <p className="text-3xl font-bold">
                {stats.totalRequests[0]?.total || 0}
              </p>
            </div>
          </div>

          <div className="card bg-base-100 shadow-md">
            <div className="card-body">
              <h2 className="card-title text-sm">Avg Response Time</h2>
              <p className="text-3xl font-bold">
                {stats.avgResponseTime[0]?.avgTime?.toFixed(0) || 0}ms
              </p>
            </div>
          </div>

          <div className="card bg-base-100 shadow-md">
            <div className="card-body">
              <h2 className="card-title text-sm">Most Common Method</h2>
              <p className="text-3xl font-bold">
                {stats.byMethod[0]?._id || 'N/A'}
              </p>
            </div>
          </div>

          <div className="card bg-base-100 shadow-md">
            <div className="card-body">
              <h2 className="card-title text-sm">Success Rate</h2>
              <p className="text-3xl font-bold">
                {(() => {
                  const total = stats.totalRequests[0]?.total || 0;
                  const success = stats.byStatusCode
                    .filter(s => s._id >= 200 && s._id < 300)
                    .reduce((sum, s) => sum + s.count, 0);
                  return total > 0 ? ((success / total) * 100).toFixed(1) : 0;
                })()}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card bg-base-100 shadow-md mb-6">
        <div className="card-body">
          <h2 className="card-title text-lg mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* Method Filter */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Method</span>
              </label>
              <select
                className="select select-bordered"
                value={filters.method}
                onChange={(e) => handleFilterChange('method', e.target.value)}
              >
                <option value="">All</option>
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
                <option value="PATCH">PATCH</option>
              </select>
            </div>

            {/* Event Type Filter */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Event Type</span>
              </label>
              <select
                className="select select-bordered"
                value={filters.eventType}
                onChange={(e) => handleFilterChange('eventType', e.target.value)}
              >
                <option value="">All</option>
                <option value="Login">Login</option>
                <option value="Logout">Logout</option>
                <option value="Create">Create</option>
                <option value="Update">Update</option>
                <option value="Delete">Delete</option>
                <option value="View">View</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* User ID Filter */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">User ID</span>
              </label>
              <input
                type="text"
                placeholder="Enter User ID"
                className="input input-bordered"
                value={filters.userId}
                onChange={(e) => handleFilterChange('userId', e.target.value)}
              />
            </div>

            {/* Start Date */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Start Date</span>
              </label>
              <input
                type="date"
                className="input input-bordered"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </div>

            {/* End Date */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">End Date</span>
              </label>
              <input
                type="date"
                className="input input-bordered"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>
          </div>

          <div className="mt-4">
            <button className="btn btn-outline btn-sm" onClick={clearFilters}>
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="card bg-base-100 shadow-md">
        <div className="card-body">
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>User</th>
                  <th>Method</th>
                  <th>Path</th>
                  <th>Event Type</th>
                  <th>Status</th>
                  <th>Response Time</th>
                  <th>IP Address</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8">
                      No logs found
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log._id}>
                      <td className="text-xs">
                        {formatDate(log.createdAt)}
                      </td>
                      <td>
                        <div>
                          <div className="font-semibold text-sm">
                            {log.userId || 'Anonymous'}
                          </div>
                          {log.userEmail && (
                            <div className="text-xs text-gray-500">
                              {log.userEmail}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-outline">
                          {log.method}
                        </span>
                      </td>
                      <td className="text-xs max-w-xs truncate" title={log.path}>
                        {log.path}
                      </td>
                      <td>
                        <span className={`badge ${getEventTypeBadgeColor(log.eventType)}`}>
                          {log.eventType}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${getStatusBadgeColor(log.statusCode)}`}>
                          {log.statusCode}
                        </span>
                      </td>
                      <td className="text-sm">
                        {log.responseTime}ms
                      </td>
                      <td className="text-xs">
                        {log.ip}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <button
                className="btn btn-sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </button>
              <span className="flex items-center px-4">
                Page {page} of {totalPages}
              </span>
              <button
                className="btn btn-sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
