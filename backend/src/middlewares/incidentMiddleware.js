// import jwt from 'jsonwebtoken';
// import User from '../models/user.js'; 

// /**
//  * @desc    Middleware to protect routes
//  * @desc    Checks for a valid JWT token in the Authorization header
//  */
// const protect = async (req, res, next) => {
//   let token;

//   // Check for the 'Authorization' header and if it starts with 'Bearer'
//   if (
//     req.headers.authorization &&
//     req.headers.authorization.startsWith('Bearer')
//   ) {
//     try {
//       // Get token from header (e.g., "Bearer <token>")
//       token = req.headers.authorization.split(' ')[1];

//       // Verify the token using your JWT_SECRET
//       const decoded = jwt.verify(token, process.env.JWT_SECRET);
//       req.user = await User.findById(decoded.id).select('-password');

//       if (!req.user) {
//          return res.status(401).json({ message: 'Not authorized, user not found' });
//       }

//       // Move to the next middleware or controller
//       next();
//     } catch (error) {
//       console.error(error);
//       return res.status(401).json({ message: 'Not authorized, token failed' });
//     }
//   }

//   if (!token) {
//     return res.status(401).json({ message: 'Not authorized, no token' });
//   }
// };

// /**
//  * @desc    Middleware to authorize based on user role
//  * @param   {...string} roles - A list of roles (e.g., 'admin', 'operator')
//  */
// const authorize = (...roles) => {
//   return (req, res, next) => {
//     // 'protect' middleware must run first to attach req.user
//     if (!req.user || !roles.includes(req.user.role)) {
//       return res.status(403).json({ message: `User role '${req.user.role}' is not authorized to access this route` });
//     }
//     // User has the correct role, proceed
//     next();
//   };
// };

// export { protect, authorize };