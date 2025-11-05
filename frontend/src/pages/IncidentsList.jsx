import { useEffect, useState, useContext } from 'react'
import incidentsService from '../services/incidentsService.js'
import { Link, useNavigate } from 'react-router-dom'
import { AuthContext } from '../services/authContext.js'
import RoleRoute from '../components/RoleRoute.jsx'

export default function IncidentsList() {
  const [incidents, setIncidents] = useState([])
  const [loading, setLoading] = useState(true)
  const { user } = useContext(AuthContext)
  const navigate = useNavigate()

  useEffect(() => {
    async function fetch() {
      try {
        const data = await incidentsService.getAllIncidents()
        setIncidents(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  if (loading) return <div className="p-6">Loading incidents...</div>

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Incidents</h1>
        {user && (user.role === 'admin' || user.role === 'operator') ? (
          <Link to="/incidents/new" className="btn btn-primary">Create Incident</Link>
        ) : null}
      </div>

      {incidents.length === 0 ? (
        <p>No incidents found.</p>
      ) : (
        <ul className="space-y-3">
          {incidents.map((inc) => (
            <li key={inc._id} className="card bg-base-100 p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold">{inc.ticketId} — {inc.title}</h3>
                  <p className="text-sm text-gray-500">Status: {inc.status} • Priority: {inc.priority}</p>
                  <p className="text-sm">Assigned to: {inc.assignedTo?.username || 'Unknown'}</p>
                </div>
                <div className="flex gap-2">
                  <button className="btn btn-outline" onClick={() => navigate(`/incidents/${inc._id}`)}>View</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
