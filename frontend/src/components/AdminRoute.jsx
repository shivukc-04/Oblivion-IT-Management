// import { useContext } from 'react';
// import { Navigate } from 'react-router-dom';  // ← Use Navigate, not useNavigate
// import { AuthContext } from '../services/authContext.js';
// import toast from 'react-hot-toast';

// export default function AdminRoute({ children }) {
//   const { user, loading } = useContext(AuthContext);

//   // ✅ Show loading while checking auth
//   if (loading) {
//     return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
//   }

//   // ✅ Not logged in
//   if (!user) {
//     toast.error('Please login first');
//     return <Navigate to="/login" replace />;
//   }

//   // ✅ Logged in but not admin
//   if (user.role !== 'admin') {
//     toast.error(`Only admins can access this page ${user.role}}`);
//     return <Navigate to="/" replace />;
//   }

// //   ✅ Authorized admin
//   return children;
// }