import { useState, useEffect } from 'react'
import { jwtDecode } from 'jwt-decode'
import { AuthContext } from './authContext'

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const token = localStorage.getItem('authToken')
    if (token) {
      try {
        const decoded = jwtDecode(token);
        console.log({...decoded})
        setUser({ ...decoded });
      } catch (err) {
        console.error('Invalid token', err);
        localStorage.removeItem('authToken');
      }
    }
    setLoading(false)
  }, []);
  // useEffect(()=>{
  //   console.log(`inside useEffect user = ${user.role}`)
  // },[user])

  // const login = (token) => {
  //   localStorage.setItem('token', token);
  //   const decoded = jwtDecode(token);
  //   setUser({ ...decoded });
  // };

  // // ✅ Add logout function
  // const logout = () => {
  //   localStorage.removeItem('token');
  //   setUser(null);
  // };

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
