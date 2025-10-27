import { useState } from 'react';
import api from '../src/services/axiosConfig.js'

export default function App() {
  const [users, setUsers] = useState([]);

  async function fetchUsers() {
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error:', error);
    }
  }

  return (
    <div data-theme="corporate" className="min-h-screen bg-base-200 p-8">
      <button className="btn btn-primary mb-4" onClick={fetchUsers}>
        Show All Users
      </button>

      <ul className="space-y-2">
        {users.map((user, index) => (
          <li key={index} className="bg-white p-3 rounded shadow">
            {user.userId}
          </li>
        ))}
      </ul>
    </div>
  );
}