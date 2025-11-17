import { useEffect, useState } from 'react';
import serversApi from '../services/serversService.js';
import toast from 'react-hot-toast';

export default function ServersPage() {
  const [servers, setServers] = useState([]);
  const [form, setForm] = useState({ serverId: '', ip: '', status: 'active' });
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const data = await serversApi.getServers();
      setServers(data);
    } catch (err) {
      toast.error('Failed to load servers');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const created = await serversApi.createServer(form);
      toast.success('Server added');
      setForm({ serverId: '', ip: '', status: 'active' });
      setServers(prev => [created, ...prev]);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create server');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this server?')) return;
    try {
      await serversApi.deleteServer(id);
      toast.success('Server deleted');
      setServers(prev => prev.filter(s => s._id !== id));
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl mb-4">Servers (Admin)</h2>
      <form onSubmit={handleCreate} className="mb-4 space-y-2">
        <input className="input input-bordered w-full" placeholder="Server ID" value={form.serverId} onChange={e => setForm({...form, serverId: e.target.value})} required />
        <input className="input input-bordered w-full" placeholder="IP Address" value={form.ip} onChange={e => setForm({...form, ip: e.target.value})} required />
        <select className="select select-bordered w-full" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
          <option value="active">active</option>
          <option value="inactive">inactive</option>
          <option value="maintainance">maintainance</option>
          <option value="critical">critical</option>
          <option value="retired">retired</option>
        </select>
        <button className="btn btn-primary" type="submit">Add Server</button>
      </form>

      {loading ? <div>Loading...</div> : (
        <ul className="space-y-2">
          {servers.map(s => (
            <li key={s._id} className="bg-white p-3 rounded shadow flex justify-between items-center">
              <div>
                <div className="font-semibold">{s.serverId}</div>
                <div className="text-sm text-gray-500">{s.ip} • {s.status}</div>
              </div>
              <div>
                <button className="btn btn-sm btn-error" onClick={() => handleDelete(s._id)}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
